import fs from 'fs';
import path from 'path';
import { compileTrace } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import computeEvidence from './evidence/computeEvidence.js';
import discoverJourneys from '../test/discoverJourneys.js';
import formatEvidence from '../test/formatEvidence.js';
import formatZeroBacked from './evidence/formatZeroBacked.js';
import loadBlockMetas from './loadBlockMetas.js';
import readProductionTrace from './readProductionTrace.js';
import resolveBuildDirectory from './resolveBuildDirectory.js';
import validateJourney from '../test/validateJourney.js';
import writeEvidenceNode from './evidence/writeEvidenceNode.js';

const SOURCES = ['production'];

// The committed journeys evidence is computed for, with each one's place in
// its file. A file that does not parse, or a journey that does not validate,
// is reported and left alone.
function readCommittedJourneys({ context }) {
  const journeys = [];
  const skipped = [];
  const indexByFile = new Map();
  discoverJourneys({ context }).forEach((item) => {
    const journeyIndex = indexByFile.get(item.filePath) ?? 0;
    indexByFile.set(item.filePath, journeyIndex + 1);
    const file = path.relative(context.directories.config, item.filePath);
    if (!type.isNone(item.error)) {
      skipped.push(`${file}: ${item.error}`);
      return;
    }
    const validation = validateJourney({ journey: item.journey });
    if (!validation.valid) {
      skipped.push(`${file}: ${validation.message}`);
      return;
    }
    journeys.push({ filePath: item.filePath, file, journeyIndex, journey: item.journey });
  });
  return { journeys, skipped };
}

function readProductionSegments({ context }) {
  const { options } = context;
  const { records, window } = readProductionTrace({
    directories: context.directories,
    since: options.since,
    from: options.from,
    to: options.to,
  });
  const { segments } = compileTrace({
    records,
    blockMetas: loadBlockMetas({ buildDirectory: resolveBuildDirectory({ context }) }),
    source: 'production',
    filters: {
      since: Date.parse(`${window.from}T00:00:00.000Z`),
      until: Date.parse(`${window.to}T23:59:59.999Z`),
    },
  });
  return { segments, window };
}

function summarise({ evidence }) {
  const text = formatEvidence({ evidence });
  return text === '' ? 'no evidence' : text;
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
  const production = readProductionSegments({ context });
  const results = computeEvidence({
    journeys,
    sources: { production },
    today: new Date(Date.now()).toISOString().slice(0, 10),
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
