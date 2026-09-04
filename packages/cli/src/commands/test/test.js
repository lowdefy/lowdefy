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

import { type } from '@lowdefy/helpers';

import discoverJourneys from './discoverJourneys.js';
import formatJourneyResult from './formatJourneyResult.js';
import reportJourneyCoverage from './journeyCoverage/reportJourneyCoverage.js';
import prepareSeeding from './prepareSeeding.js';
import requestTestSuite from './requestTestSuite.js';
import resolveTestServer from './resolveTestServer.js';
import runJourney from './runJourney.js';

// Each suite discovers its own test items and runs one item against the dev
// server. `getSeeds(item)` declares the data that item needs - a journey's
// `fixtures`, a request test's `fixtures` and `seed` - which prepareSeeding
// reads before the server boots.
const suites = [
  {
    name: 'journeys',
    getItemName: (item) => item.journey?.name ?? item.filePath,
    getSeeds: (item) => ({ fixtures: item.journey?.fixtures }),
    discover: discoverJourneys,
    run: runJourney,
    format: formatJourneyResult,
  },
  requestTestSuite,
];

function matchesFilter({ suite, item, filter }) {
  if (type.isNone(filter)) {
    return true;
  }
  return suite.getItemName(item).toLowerCase().includes(filter.toLowerCase());
}

// A run that seeds needs a server the runner controls: the connection overrides
// that point every seeded connection at the in-memory MongoDB are handed to the
// server as environment, which an already running development server never read.
// Request tests need one too, for the runner-scoped write allowance. A journey
// that seeds nothing only reads the app, so it runs against whichever server is
// already up.
function needsOwnServer({ selected, session }) {
  return !type.isNone(session.client) || selected.some(({ suite }) => suite === requestTestSuite);
}

async function test({ context }) {
  const filter = context.options.filter;
  const items = suites.flatMap((suite) =>
    suite.discover({ context }).map((item) => ({ suite, item }))
  );
  const selected = items.filter(({ suite, item }) => matchesFilter({ suite, item, filter }));

  if (selected.length === 0) {
    if (type.isNone(filter)) {
      context.logger.warn(
        'No tests found. Add journeys to tests/journeys/*.yaml or request tests to tests/requests/*.test.yaml.'
      );
      context.sendTelemetry();
      return;
    }
    context.logger.error(`No tests matched --filter "${filter}".`);
    context.sendTelemetry();
    process.exitCode = 1;
    return;
  }

  let session;
  try {
    session = await prepareSeeding({
      context,
      seeds: selected.map(({ suite, item }) => suite.getSeeds(item)),
    });
  } catch (error) {
    context.logger.error(error.message);
    context.sendTelemetry();
    process.exitCode = 1;
    return;
  }

  let server;
  try {
    server = await resolveTestServer({
      context,
      env: session.env,
      reuseRunningServer: !needsOwnServer({ selected, session }),
    });
  } catch (error) {
    await session.stop();
    throw error;
  }
  let interrupted = false;
  async function onSigint() {
    interrupted = true;
    context.logger.warn('Interrupted. Stopping development server.');
    await server.stop();
    await session.stop();
    process.exit(130);
  }
  process.once('SIGINT', onSigint);

  const results = [];
  try {
    for (const { suite, item } of selected) {
      const result = await suite.run({
        context,
        item,
        url: server.url,
        session,
      });
      results.push(result);
      const lines = suite.format({ result });
      if (result.passed) {
        lines.forEach((line) => context.logger.info(line));
      } else {
        lines.forEach((line) => context.logger.error(line));
      }
    }
  } finally {
    process.removeListener('SIGINT', onSigint);
    if (!interrupted) {
      await server.stop();
      await session.stop();
    }
  }

  // Coverage is a property of the committed journeys, not of this run, so it is
  // computed from every discovered journey even when --filter narrowed the run.
  if (context.options.coverage === true) {
    reportJourneyCoverage({
      context,
      journeys: items.filter(({ suite }) => suite.name === 'journeys').map(({ item }) => item),
    });
  }

  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  const summary = `${passed} passed, ${failed} failed of ${results.length} tests`;
  if (failed > 0) {
    context.logger.error(summary);
    process.exitCode = 1;
  } else {
    context.logger.info(summary);
  }
  context.sendTelemetry();
}

export default test;
