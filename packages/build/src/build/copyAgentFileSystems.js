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

import path from 'path';
import fs from 'fs';
import { copyFileOrDirectory } from '@lowdefy/node-utils';

async function copyAgentFileSystems({ components, context }) {
  if (context.directories.config === context.directories.server) return;

  const copied = new Set();
  for (const agent of components.agents ?? []) {
    const basePath = agent.properties?.fileSystem?.basePath;
    if (!basePath || typeof basePath !== 'string') continue;
    if (copied.has(basePath)) continue;

    const source = path.resolve(context.directories.config, basePath);
    if (!fs.existsSync(source)) continue;

    const dest = path.resolve(context.directories.server, basePath);
    await copyFileOrDirectory(source, dest);
    copied.add(basePath);
  }
}

export default copyAgentFileSystems;
