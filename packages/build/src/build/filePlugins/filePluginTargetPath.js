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

import path from 'node:path';

/**
 * The absolute path the generated barrels import a file plugin from.
 *
 * Dev imports the file in place under the config directory — Vite serves it
 * through server.fs.allow and hot-replaces it — while prod imports the copy
 * copyFilePlugins places at <server>/<config-root relative path>, because the
 * prod server directory must run with the config directory absent. This is the
 * same fork writeJs makes for _js modules.
 */
function filePluginTargetPath({ context, record }) {
  if (context.stage === 'prod') {
    return path.resolve(context.directories.server, record.relativePath);
  }
  return record.file;
}

export default filePluginTargetPath;
