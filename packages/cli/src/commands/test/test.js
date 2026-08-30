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
import runJourney from './runJourney.js';
import startDevServer from './startDevServer.js';

// Each suite discovers its own test items and runs one item against the dev server.
// Request tests (tests/requests/*.test.yaml) are added here as a second entry.
const suites = [
  {
    name: 'journeys',
    discover: discoverJourneys,
    run: runJourney,
    format: formatJourneyResult,
  },
];

function getItemName(item) {
  return item.journey?.name ?? item.filePath;
}

function matchesFilter({ item, filter }) {
  if (type.isNone(filter)) {
    return true;
  }
  return getItemName(item).toLowerCase().includes(filter.toLowerCase());
}

function trimTrailingSlash(url) {
  return url.replace(/\/+$/, '');
}

async function resolveServer({ context }) {
  if (type.isString(context.options.url) && context.options.url !== '') {
    context.logger.info(`Running tests against ${context.options.url}.`);
    return { url: trimTrailingSlash(context.options.url), stop: async () => {} };
  }
  try {
    return await startDevServer({ context });
  } catch (error) {
    (error.serverOutput ?? []).forEach((line) => context.logger.error(line));
    throw error;
  }
}

async function test({ context }) {
  const filter = context.options.filter;
  const items = suites.flatMap((suite) =>
    suite.discover({ context }).map((item) => ({ suite, item }))
  );
  const selected = items.filter(({ item }) => matchesFilter({ item, filter }));

  if (selected.length === 0) {
    if (type.isNone(filter)) {
      context.logger.warn('No tests found. Add journeys to tests/journeys/*.yaml.');
      context.sendTelemetry();
      return;
    }
    context.logger.error(`No tests matched --filter "${filter}".`);
    context.sendTelemetry();
    process.exitCode = 1;
    return;
  }

  const server = await resolveServer({ context });
  let interrupted = false;
  async function onSigint() {
    interrupted = true;
    context.logger.warn('Interrupted. Stopping development server.');
    await server.stop();
    process.exit(130);
  }
  process.once('SIGINT', onSigint);

  const results = [];
  try {
    for (const { suite, item } of selected) {
      const result = await suite.run({ context, item, url: server.url });
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
    }
  }

  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  const summary = `${passed} passed, ${failed} failed of ${results.length} journeys`;
  if (failed > 0) {
    context.logger.error(summary);
    process.exitCode = 1;
  } else {
    context.logger.info(summary);
  }
  context.sendTelemetry();
}

export default test;
