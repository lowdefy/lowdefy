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

import { compileTrace } from '@lowdefy/node-utils';

import computeTraceCoverage from './computeTraceCoverage.js';
import discoverJourneys from '../test/discoverJourneys.js';
import readTrace from './readTrace.js';

// `lowdefy journeys coverage <trace.jsonl>`: what the corpus locks of what the
// users did, and the uncovered triples ranked by how many sessions drove them -
// which is the next test to write, in order.
async function journeysCoverage({ context, params }) {
  const [traceFile] = params;
  const { filePath, trace } = readTrace({ context, traceFile });
  const { sessions, triples } = compileTrace({ trace });
  const journeys = discoverJourneys({ context });
  const coverage = computeTraceCoverage({ journeys, triples });

  context.logger.info(
    `${sessions} sessions in ${filePath} drove ${coverage.total} (page, block, event) triples.`
  );
  context.logger.info(
    `Journey coverage: ${coverage.covered}/${coverage.total} (${Math.round(
      coverage.share * 100
    )}%) across ${journeys.length} committed journeys.`
  );
  if (coverage.uncovered.length === 0) {
    context.logger.info('Every triple the trace saw is exercised by a committed journey.');
  } else {
    context.logger.info('Uncovered, most-used first:');
    coverage.uncovered.forEach((triple) => {
      context.logger.info(
        `  ${triple.page_id} ${triple.block_id} ${triple.event_name} - ${triple.sessions} sessions`
      );
    });
  }

  await context.sendTelemetry();
  return coverage;
}

export default journeysCoverage;
