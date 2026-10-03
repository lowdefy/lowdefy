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

import resolveDevAuthUrl from './resolveDevAuthUrl.mjs';

// The environment of the Vite child, shared with the dependency optimiser so
// it resolves the same Vite config (and so the same cache hash) as the child
// that later reads its cache. Read on every call: a .env edit can change
// BETTER_AUTH_URL, and the watcher restarts the child with the reloaded value.
function createServerEnv(context) {
  return {
    ...process.env,
    LOWDEFY_DIRECTORY_CONFIG: context.directories.config,
    // Set only while the manager's mail sink listens: the child cannot
    // tell from LOWDEFY_DEV_SMTP_PORT alone, which a later .env edit can
    // add without a sink (it starts once, with the manager).
    LOWDEFY_SERVER_DEV_MAIL_SINK: context.mailSink ? 'true' : undefined,
    PORT: context.internalPort,
    BETTER_AUTH_URL: resolveDevAuthUrl({
      configured: process.env.BETTER_AUTH_URL,
      port: context.options.port,
    }),
  };
}

export default createServerEnv;
