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

import fs from 'fs';
import path from 'path';

const FILE_NAME = 'plugin-checks-pending.json';

// Names the packages whose checks did not run because they were not
// installed, each as { name, schemaChecked }, so the CLI installs them and
// decides whether to build again (pluginChecksNeedRebuild in
// @lowdefy/node-utils); removes the file when none is.
async function writePluginChecksPending({ context, packages }) {
  if (context.validateOnly) return;
  if (packages.length === 0) {
    await fs.promises.rm(path.join(context.directories.build, FILE_NAME), { force: true });
    return;
  }
  await context.writeBuildArtifact(FILE_NAME, JSON.stringify({ packages }, null, 2));
}

export default writePluginChecksPending;
