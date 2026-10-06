/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import fs from 'fs';
import { compileTrace } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import computeEvidence from './evidence/computeEvidence.js';
import createTokenResolver from './createTokenResolver.js';
import describeMissingPull from './describeMissingPull.js';
import formatEvidence from '../test/formatEvidence.js';
import formatZeroBacked from './evidence/formatZeroBacked.js';
import listFinalDays from './listFinalDays.js';
import loadBlockMetas from './loadBlockMetas.js';
import readCommittedJourneys from './readCommittedJourneys.js';
import readDevSegments from './readDevSegments.js';
import readMutationReport from './readMutationReport.js';
import readConfigText from './configText/readConfigText.js';
import readProductionMonths from './readProductionMonths.js';
import readTraceSalt from './pull/readTraceSalt.js';
import removeUntokenisedTraces from './removeUntokenisedTraces.js';
import resolveBuildDirectory from './resolveBuildDirectory.js';
import selectMonthsToRead from './evidence/selectMonthsToRead.js';
import writeEvidenceNode from './evidence/writeEvidenceNode.js';

const SOURCES = ['production'];

// The PASS line's evidence, plus the dev recordings, which the PASS line
// leaves out but a refresh can change.
function summarise({ evidence }) {
  const parts = [formatEvidence({ evidence })].filter((part) => part !== '');
  const recordings = evidence?.dev?.recordings;
  if (!type.isUndefined(recordings)) {
    parts.push(`${recordings} dev recordings`);
  }
  return parts.length === 0 ? 'no evidence' : parts.join(' · ');
}

function countDaysByMonth({ days }) {
  const counts = {};
  days.forEach((day) => {
    const month = day.slice(0, 7);
    counts[month] = (counts[month] ?? 0) + 1;
  });
  return counts;
}

// Final days the cache holds but this machine cannot read are named, with the
// pull that fetches them again, so a month that did not update says why: a
// day hashed under another salt resolves none of its tokens. With no salt at
// all, the pull writes a new one.
function warnUnreadDays({ logger, otherSalt, traceSalt }) {
  if (otherSalt.length === 0) return;
  const shown =
    otherSalt.length > 5 ? `${otherSalt.slice(0, 5).join(', ')}, …` : otherSalt.join(', ');
  const pull = describeMissingPull({ missing: otherSalt });
  if (type.isNone(traceSalt)) {
    logger.warn(
      `There is no trace salt in .lowdefy/traces/production/, so ${otherSalt.length} final day(s) of the production cache cannot be read (${shown}). Pulling them again hashes them under a new salt. ${pull}`
    );
    return;
  }
  logger.warn(
    `Left out ${otherSalt.length} final day(s) of the production cache pulled under another trace salt (${shown}). Pulling them again hashes them under this machine's salt. ${pull}`
  );
}

// The production source of a refresh: how many final days the cache holds of
// each month, and the segments of the months some journey's counts can still
// change in, compiled in one pass. Days pulled before clicked text was stored
// as tokens are removed first, as every production read removes them. Only
// days hashed under this machine's salt are read, with their tokens resolved
// to config text; the rest are named with the pull that fetches them again.
// Undefined when the cache holds no such final day, so the committed
// production evidence is kept.
function readProduction({ context, journeys, today, now, configText }) {
  const { directories, logger } = context;
  removeUntokenisedTraces({ directories, logger, now });
  const traceSalt = readTraceSalt({ directories });
  const { days: finalDays, otherSalt } = listFinalDays({
    directories,
    saltId: type.isNone(traceSalt) ? null : traceSalt.saltId,
  });
  warnUnreadDays({ logger, otherSalt, traceSalt });
  if (finalDays.length === 0) {
    if (otherSalt.length === 0) {
      logger.warn(
        'The production trace cache holds no final day. Run "lowdefy journeys pull posthog" first to count production use.'
      );
    }
    return undefined;
  }
  const dayCounts = countDaysByMonth({ days: finalDays });
  const months = selectMonthsToRead({
    journeys: journeys.map((entry) => entry.journey),
    dayCounts,
    today,
    isConfigText: configText.isConfigText,
  });
  if (months.length === 0) return { dayCounts, months, segments: [], days: [] };
  const { records, days } = readProductionMonths({
    directories,
    finalDays,
    months,
    resolve: createTokenResolver({ salt: traceSalt.salt, texts: configText.texts }),
  });
  const { segments } = compileTrace({
    records,
    blockMetas: loadBlockMetas({ buildDirectory: resolveBuildDirectory({ context }) }),
    source: 'production',
  });
  return { dayCounts, months, segments, days };
}

function describeRead({ production }) {
  if (type.isUndefined(production)) {
    return 'with no final day in the production cache, so production evidence is kept as committed';
  }
  if (production.months.length === 0) {
    return 'with no new final days in the production cache';
  }
  return `over ${production.days.length} final days of ${production.months.join(', ')}`;
}

// Writes every changed journey of each file in turn. A file whose evidence
// cannot be placed is reported and left as it was.
function writeChanged({ changed, logger }) {
  const byFile = new Map();
  changed.forEach((result) => {
    if (!byFile.has(result.filePath)) byFile.set(result.filePath, []);
    byFile.get(result.filePath).push(result);
  });
  let written = 0;
  byFile.forEach((results, filePath) => {
    const original = fs.readFileSync(filePath, 'utf8');
    let text = original;
    try {
      results.forEach((result) => {
        text = writeEvidenceNode({
          text,
          journeyIndex: result.journeyIndex,
          evidence: result.after,
        });
      });
    } catch (error) {
      logger.warn(`Left ${results[0].file} unchanged: ${error.message}`);
      return;
    }
    if (text !== original) {
      fs.writeFileSync(filePath, text);
      written += results.length;
    }
  });
  return written;
}

// `lowdefy journeys evidence [--refresh]`: how much production use backs each
// committed journey, by calendar month. Without --refresh it prints what would
// change; with it, it rewrites only the `evidence` node of the journeys whose
// numbers moved - the only command that writes that key. It reads every final
// day of the production cache, not a window, and then lists the journeys
// nothing backs over the usage window, and removes none of them. A journey's
// click text counts only when it is config text, in its counts, its sequence
// id and its flow lines alike.
async function journeysEvidence({ context }) {
  const { options, logger } = context;
  const source = options.source ?? 'production';
  if (!SOURCES.includes(source)) {
    throw new Error(`--source should be ${SOURCES.join(', ')}. Received "${source}".`);
  }
  const { journeys, skipped } = readCommittedJourneys({ context });
  skipped.forEach((line) => logger.warn(`Skipped ${line}`));
  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);
  const configText = await readConfigText({ context });
  const production = readProduction({ context, journeys, today, now, configText });
  const results = computeEvidence({
    journeys,
    sources: {
      production,
      dev: readDevSegments({ context, now }),
      mutation: readMutationReport({ directories: context.directories }),
    },
    today,
    isConfigText: configText.isConfigText,
  });

  const changed = results.filter((result) => result.changed);
  changed.forEach((result) => {
    logger.info(
      `${result.file}#${result.name}: ${summarise({ evidence: result.before })} -> ${summarise({
        evidence: result.after,
      })}`
    );
  });
  const read = describeRead({ production });
  if (options.refresh === true) {
    const written = writeChanged({ changed, logger });
    logger.info(`Refreshed evidence for ${written} of ${results.length} journeys ${read}.`);
  } else {
    logger.info(
      `${changed.length} of ${results.length} journeys would change ${read}. Run with --refresh to write them.`
    );
  }
  formatZeroBacked({ results }).forEach((line) => logger.info(line));

  await context.sendTelemetry();
  return { results, months: production?.months ?? [] };
}

export default journeysEvidence;
