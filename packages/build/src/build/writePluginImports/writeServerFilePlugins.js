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
// Kinds the Node processes load directly and hold in their ESM module cache.
// Blocks, actions and client operators are bundled by Vite, which hot-replaces
// the file in place - only these need a restart when the author edits them.
const SERVER_KINDS = ['operators.build', 'operators.server', 'connections', 'requests'];

// The dev manager's jsModuleWatcher restarts the server when one of these files
// changes, exactly as it does for the server-side _js modules writeJs lists in
// js/serverModules.json - same watcher, same artefact shape, no new machinery.
async function writeServerFilePlugins({ context }) {
  const files = [
    ...new Set(
      (context.filePlugins ?? [])
        .filter((record) => SERVER_KINDS.includes(record.kind))
        .map((record) => record.file)
    ),
  ].sort();
  await context.writeBuildArtifact('js/serverFilePlugins.json', JSON.stringify(files));
}

export default writeServerFilePlugins;
