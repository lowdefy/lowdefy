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
import { type } from '@lowdefy/helpers';

import computeEvidence from './evidence/computeEvidence.js';
import formatEvidence from '../test/formatEvidence.js';
import formatZeroBacked from './evidence/formatZeroBacked.js';
import readCommittedJourneys from './readCommittedJourneys.js';
import readDevSegments from './readDevSegments.js';
import readMutationReport from './readMutationReport.js';
import readProductionSegments from './readProductionSegments.js';
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
// committed journey. Without --refresh it prints what would change; with it,
// it rewrites only the `evidence` node of the journeys whose numbers moved -
// the only command that writes that key. It then lists the journeys nothing
// in the window backs, and removes none of them.
async function journeysEvidence({ context }) {
  const { options, logger } = context;
  const source = options.source ?? 'production';
  if (!SOURCES.includes(source)) {
    throw new Error(`--source should be ${SOURCES.join(', ')}. Received "${source}".`);
  }
  const { journeys, skipped } = readCommittedJourneys({ context });
  skipped.forEach((line) => logger.warn(`Skipped ${line}`));
  const production = await readProductionSegments({ context });
  const now = Date.now();
  const results = computeEvidence({
    journeys,
    sources: {
      production,
      dev: readDevSegments({ context, now }),
      mutation: readMutationReport({ directories: context.directories }),
    },
    today: new Date(now).toISOString().slice(0, 10),
    isConfigText: production.isConfigText,
  });

  const changed = results.filter((result) => result.changed);
  changed.forEach((result) => {
    logger.info(
      `${result.file}#${result.name}: ${summarise({ evidence: result.before })} -> ${summarise({
        evidence: result.after,
      })}`
    );
  });
  if (options.refresh === true) {
    const written = writeChanged({ changed, logger });
    logger.info(
      `Refreshed evidence for ${written} of ${results.length} journeys over ${production.window.from}/${production.window.to}.`
    );
  } else {
    logger.info(
      `${changed.length} of ${results.length} journeys would change over ${production.window.from}/${production.window.to}. Run with --refresh to write them.`
    );
  }
  formatZeroBacked({ results, window: production.window }).forEach((line) => logger.info(line));

  await context.sendTelemetry();
  return { results, window: production.window };
}

export default journeysEvidence;
