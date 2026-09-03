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
import requestTestSuite from './requestTestSuite.js';
import resolveTestServer from './resolveTestServer.js';
import runJourney from './runJourney.js';

// Each suite discovers its own test items and runs one item against the dev server.
// An optional `prepare({ context, items })` runs before the server boots and returns
// { env, stop, ...session }: env is merged into the server's environment and the
// session is passed to every run of that suite.
const suites = [
  {
    name: 'journeys',
    getItemName: (item) => item.journey?.name ?? item.filePath,
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

async function prepareSuites({ context, selected }) {
  const sessions = new Map();
  let env = {};
  for (const suite of suites) {
    const items = selected.filter((entry) => entry.suite === suite).map((entry) => entry.item);
    if (items.length === 0 || type.isNone(suite.prepare)) {
      sessions.set(suite, {});
      continue;
    }
    const session = await suite.prepare({ context, items });
    env = { ...env, ...(session.env ?? {}) };
    sessions.set(suite, session);
  }
  async function stop() {
    for (const session of sessions.values()) {
      if (!type.isNone(session.stop)) {
        await session.stop();
      }
    }
  }
  return { sessions, env, stop };
}

// Request tests need a server the runner controls: their connection overrides
// and the runner-scoped write allowance are handed to the server as environment,
// which an already running development server never read. Journeys only read the
// app, so they run against whichever server is already up.
function needsOwnServer({ selected }) {
  return selected.some(({ suite }) => suite === requestTestSuite);
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

  let prepared;
  try {
    prepared = await prepareSuites({ context, selected });
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
      env: prepared.env,
      reuseRunningServer: !needsOwnServer({ selected }),
    });
  } catch (error) {
    await prepared.stop();
    throw error;
  }
  let interrupted = false;
  async function onSigint() {
    interrupted = true;
    context.logger.warn('Interrupted. Stopping development server.');
    await server.stop();
    await prepared.stop();
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
        session: prepared.sessions.get(suite),
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
      await prepared.stop();
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
