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

import startDevServer from '../../test/startDevServer.js';
import waitForDevInstance from './waitForDevInstance.js';

function trimTrailingSlash(url) {
  return url.replace(/\/+$/, '');
}

// The dev server the walks run against, resolved as lowdefy test resolves
// it, with one change: a dev server that is still starting (one the hub just
// started) is waited on until it is ready, so the explorer never reinstalls
// .lowdefy/dev under it or races its instance lock. Only when no server is
// running or starting does it start its own headless one, which stop()
// shuts down.
async function resolveExploreServer({
  context,
  url,
  start = startDevServer,
  wait = waitForDevInstance,
}) {
  if (url !== null) {
    context.logger.info(`Exploring against ${url}.`);
    return { url: trimTrailingSlash(url), stop: async () => {} };
  }
  const running = await wait({ configDirectory: context.directories.config });
  if (running !== null) {
    context.logger.info(`Exploring against the running dev server at ${running.url}.`);
    return { url: running.url, stop: async () => {} };
  }
  try {
    return await start({ context });
  } catch (error) {
    (error.serverOutput ?? []).forEach((line) => context.logger.error(line));
    throw error;
  }
}

export default resolveExploreServer;
