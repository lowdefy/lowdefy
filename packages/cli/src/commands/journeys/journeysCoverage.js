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

import { journeySequence, profileProduction } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import computeCoverage from './coverageReport/computeCoverage.js';
import readCommittedJourneys from './readCommittedJourneys.js';
import readMeasuredRun from './readMeasuredRun.js';
import readMutationReport from './readMutationReport.js';
import MINING_WINDOW_MAX_DAYS from './miningWindowMaxDays.js';
import readProductionSegments from './readProductionSegments.js';
import writeCoverageReport from './coverageReport/writeCoverageReport.js';

const SOURCES = ['production'];
const MEASURES = ['interaction', 'flow', 'failure', 'frustration', 'role'];
const TOP_UNCOVERED = 5;

function describeItem({ name, item }) {
  if (name === 'interaction') return `${item.page} ${item.identity}`;
  if (name === 'flow') return `${item.page} ${item.hash} (${item.sequence.length} steps)`;
  return item.key;
}

// The suite's mutation score, the sixth number, independent of production.
function scoreMutation({ report }) {
  if (type.isNone(report)) return undefined;
  const { killed, total } = report.score;
  return { killed, total, share: total === 0 ? 0 : Math.round((killed / total) * 100) / 100 };
}

function logSummary({ logger, measures, mutation, reportPath }) {
  MEASURES.forEach((name) => {
    const entry = measures[name];
    const mode = type.isString(entry.mode) ? `, ${entry.mode}` : '';
    logger.info(`${name.padEnd(12)} ${entry.covered}/${entry.total} (${entry.share}${mode})`);
    if (!type.isUndefined(entry.measured)) {
      const { measured } = entry;
      logger.info(
        `${''.padEnd(12)} ${measured.covered}/${measured.total} (${
          measured.share
        }, measured in run ${measured.run})`
      );
    }
    entry.uncovered.slice(0, TOP_UNCOVERED).forEach((item) => {
      logger.info(`  ${String(item.count).padStart(5)}  ${describeItem({ name, item })}`);
    });
  });
  if (!type.isUndefined(mutation)) {
    logger.info(
      `${'mutation'.padEnd(12)} ${mutation.killed}/${mutation.total} (${mutation.share})`
    );
  }
  logger.info(measures.failure.note);
  logger.info(`Wrote ${reportPath}.`);
}

// `lowdefy journeys coverage --source production`: which real flows,
// interactions, failures, frustrated clicks and (page, role set) pairs no
// committed journey covers yet, ranked by use. It writes
// .lowdefy/test/coverage.json with the production profile, which the explorer
// and variants read instead of profiling production again.
async function journeysCoverage({ context }) {
  const { options, logger } = context;
  const source = options.source ?? 'production';
  if (!SOURCES.includes(source)) {
    throw new Error(`--source should be ${SOURCES.join(', ')}. Received "${source}".`);
  }
  const { journeys: committed, skipped } = readCommittedJourneys({ context });
  skipped.forEach((line) => logger.warn(`Skipped ${line}`));
  const journeys = committed.map(({ file, journey }) => ({
    file,
    name: journey.name,
    pageId: journey.pageId,
    sequence: journeySequence({ pageId: journey.pageId, steps: journey.steps }),
    journey,
  }));
  const { segments, window } = await readProductionSegments({
    context,
    maxDays: MINING_WINDOW_MAX_DAYS,
  });
  const profile = profileProduction({ segments });
  const measures = computeCoverage({
    journeys,
    segments,
    profile,
    measuredRun: readMeasuredRun({ context }),
  });
  const mutation = scoreMutation({
    report: readMutationReport({ directories: context.directories }),
  });
  const { report, reportPath } = writeCoverageReport({
    directories: context.directories,
    window,
    measures,
    profile,
    journeys,
    mutation,
    generated: new Date(Date.now()).toISOString(),
  });
  if (options.json === true) {
    // The report is the command's output with --json, for scripts and agents.
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    logSummary({ logger, measures, mutation, reportPath });
  }
  await context.sendTelemetry();
  return report;
}

export default journeysCoverage;
