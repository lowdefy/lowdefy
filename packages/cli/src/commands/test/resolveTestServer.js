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

import detectRunningDevServer from './detectRunningDevServer.js';
import startDevServer from './startDevServer.js';

function trimTrailingSlash(url) {
  return url.replace(/\/+$/, '');
}

// Picks the server a run drives, in order:
//   1. --url, the caller's explicit choice.
//   2. The development server already running for this app, when the run needs
//      nothing from the server's environment (no seeded connections, no
//      runner-scoped write allowance). This is the agent's normal workflow.
//   3. A server of the runner's own in .lowdefy/test.
// `stop` is a no-op for a server this function did not start.
async function resolveTestServer({ context, env = {}, reuseRunningServer = true }) {
  if (type.isString(context.options.url) && context.options.url !== '') {
    const url = trimTrailingSlash(context.options.url);
    context.logger.info(`Running against ${url}.`);
    return { url, stop: async () => {} };
  }
  if (reuseRunningServer) {
    const running = detectRunningDevServer({ devDirectory: context.directories.dev });
    if (type.isString(running.url)) {
      context.logger.info(`Running against the development server at ${running.url}.`);
      return { url: running.url, stop: async () => {} };
    }
    if (running.running === true) {
      context.logger.warn(
        `A development server (pid ${running.pid}) is running for this app but does not record its port. Starting a separate server; pass --url to use the running one.`
      );
    }
  }
  try {
    return await startDevServer({ context, env });
  } catch (error) {
    (error.serverOutput ?? []).forEach((line) => context.logger.error(line));
    throw error;
  }
}

export default resolveTestServer;
