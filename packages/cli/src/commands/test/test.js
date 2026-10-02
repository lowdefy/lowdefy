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
import { readDevInstance } from '@lowdefy/node-utils';

import selectTests from './selectTests.js';
import startDevServer from './startDevServer.js';

const SIGNAL_EXIT_CODES = { SIGINT: 130, SIGTERM: 143, SIGHUP: 129 };

function trimTrailingSlash(url) {
  return url.replace(/\/+$/, '');
}

async function resolveServer({ context }) {
  if (type.isString(context.options.url) && context.options.url !== '') {
    context.logger.info(`Running tests against ${context.options.url}.`);
    return { url: trimTrailingSlash(context.options.url), stop: async () => {} };
  }
  // A dev server already running for this app owns .lowdefy/dev; starting a
  // second one there would be refused, so test against the running one.
  const running = readDevInstance({ configDirectory: context.directories.config });
  if (running !== null && running.state === 'ready') {
    context.logger.info(`Running tests against the running dev server at ${running.url}.`);
    return { url: running.url, stop: async () => {} };
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
  const selected = selectTests({ context, filter });

  if (selected.length === 0) {
    if (!type.isNone(filter)) {
      context.logger.error(`No tests matched --filter "${filter}".`);
      context.sendTelemetry();
      process.exitCode = 1;
      return;
    }
    // A directory named on the command line is a run that expects journeys;
    // finding none there is a mistyped path, not an app without tests yet.
    if (!type.isNone(context.options.journeysDirectory)) {
      context.logger.error(`No journeys found in ${context.directories.journeys}.`);
      context.sendTelemetry();
      process.exitCode = 1;
      return;
    }
    context.logger.warn('No tests found. Add journeys to tests/journeys/*.yaml.');
    context.sendTelemetry();
    return;
  }

  const server = await resolveServer({ context });
  let interrupted = false;
  // The dev server runs in its own process group, out of reach of a signal to
  // this CLI's group, so every signal that ends the CLI stops it first.
  const signalHandlers = Object.entries(SIGNAL_EXIT_CODES).map(([signal, exitCode]) => {
    async function onSignal() {
      if (interrupted) {
        return;
      }
      interrupted = true;
      context.logger.warn('Interrupted. Stopping development server.');
      await server.stop();
      process.exit(exitCode);
    }
    process.once(signal, onSignal);
    return [signal, onSignal];
  });

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
    signalHandlers.forEach(([signal, onSignal]) => process.removeListener(signal, onSignal));
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
