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
import { readFile, writeFile } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import agentsMd from './agentsMd.js';

const lowdefyHeadingPattern = /^##\s+Lowdefy\b/m;

// Appends a "## Lowdefy" section instead of overwriting an existing AGENTS.md, since the file
// may already document the rest of the project.
async function upsertAgentsMdSection({ context, port, devCommand }) {
  const agentsMdPath = path.join(context.directories.config, 'AGENTS.md');
  const existing = await readFile(agentsMdPath);
  const section = agentsMd({ port, devCommand });

  if (type.isNone(existing)) {
    await writeFile(agentsMdPath, `${section}`);
    context.logger.info("Created 'AGENTS.md'.");
    return;
  }

  if (lowdefyHeadingPattern.test(existing)) {
    context.logger.info("'AGENTS.md' already has a 'Lowdefy' section - skipping.");
    return;
  }

  const updated = `${existing.replace(/\s+$/, '')}\n\n${section}`;
  await writeFile(agentsMdPath, updated);
  context.logger.info("Added a 'Lowdefy' section to 'AGENTS.md'.");
}

export default upsertAgentsMdSection;
