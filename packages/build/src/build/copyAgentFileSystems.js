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
import { LowdefyInternalError } from '@lowdefy/errors';
import { copyFileOrDirectory } from '@lowdefy/node-utils';

async function copyAgentFileSystems({ components, context }) {
  const basePaths = [];
  const seen = new Set();
  for (const agent of components.agents ?? []) {
    const basePath = agent.properties?.fileSystem?.basePath;
    if (!basePath || typeof basePath !== 'string') continue;
    if (seen.has(basePath)) continue;
    seen.add(basePath);
    basePaths.push(basePath);
  }

  // Manifest of agent file system base paths copied into the server directory —
  // available to deployment tooling that needs to include these directories.
  await context.writeBuildArtifact('agentFileSystems.json', JSON.stringify(basePaths));

  if (context.directories.config === context.directories.server) return;

  for (const basePath of basePaths) {
    // buildAgents validated that every fileSystem basePath exists, so a
    // missing source here is a broken invariant, not a config fault.
    const source = path.resolve(context.directories.config, basePath);
    const dest = path.resolve(context.directories.server, basePath);
    try {
      await copyFileOrDirectory(source, dest);
    } catch (err) {
      throw new LowdefyInternalError(
        `Failed to copy agent file system "${basePath}" to the server directory.`,
        { cause: err }
      );
    }
  }
}

export default copyAgentFileSystems;
