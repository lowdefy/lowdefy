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

import { pluginChecksNeedRebuild } from '@lowdefy/node-utils';

// The initial build lists the plugins it used but could not check, since they
// were not installed. The install after it added them, so the config builds
// once more when that checks something new, unless no checks run anyway.
// This runs after the first child answers, not before it: the checks only add
// warnings or errors, the first build's output serves meanwhile, and a large
// app's config build would otherwise double the time to a usable server on a
// fresh checkout. It runs as a change does: tracked as building, so
// lowdefy_build_status({ wait: true }) reads the checked build, then synced
// and reloaded.
function checkPendingPlugins(context) {
  return async () => {
    if (
      context.options.skipPluginChecks ||
      !pluginChecksNeedRebuild({
        buildDirectory: context.directories.build,
        serverDirectory: context.directories.server,
      })
    ) {
      return;
    }
    await context.buildActivity.track(async () => {
      context.logger.info({ spin: 'start' }, 'Checking the plugins installed at start-up.');
      try {
        await context.lowdefyBuild();
      } finally {
        await context.syncServer();
        await context.reloadClients();
      }
    });
  };
}

export default checkPendingPlugins;
