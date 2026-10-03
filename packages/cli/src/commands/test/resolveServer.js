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

import startDevServer from './startDevServer.js';

function trimTrailingSlash(url) {
  return url.replace(/\/+$/, '');
}

// The dev server `lowdefy test` and `lowdefy journeys harden` run against:
// --url, else the dev server already running for this app, else a fresh
// headless one that stop() shuts down.
async function resolveServer({ context }) {
  if (type.isString(context.options.url) && context.options.url !== '') {
    context.logger.info(`Running tests against ${context.options.url}.`);
    return { url: trimTrailingSlash(context.options.url), stop: async () => {} };
  }
  // A dev server already running for this app owns .lowdefy/dev; starting a
  // second one there would be refused, so run against the running one.
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

export default resolveServer;
