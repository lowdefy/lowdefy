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

// Appends a "## Lowdefy" section to the project's existing agent instructions
// file instead of creating a competing one: an existing AGENTS.md wins, then
// an existing CLAUDE.md, and only when neither exists is an AGENTS.md
// created. Never overwrites — the file may already document the rest of the
// project.
async function upsertAgentsMdSection({ context, projectDirectory, appPath, port, devCommand }) {
  const candidates = ['AGENTS.md', 'CLAUDE.md'].map((fileName) => ({
    fileName,
    filePath: path.join(projectDirectory, fileName),
  }));
  const existingFiles = [];
  for (const candidate of candidates) {
    const content = await readFile(candidate.filePath);
    if (!type.isNone(content)) {
      existingFiles.push({ ...candidate, content });
    }
  }

  const withSection = existingFiles.find((file) => lowdefyHeadingPattern.test(file.content));
  if (withSection) {
    context.logger.info(`'${withSection.fileName}' already has a 'Lowdefy' section - skipping.`);
    return;
  }

  const section = agentsMd({ port, devCommand, appPath });

  if (existingFiles.length === 0) {
    await writeFile(path.join(projectDirectory, 'AGENTS.md'), `${section}`);
    context.logger.info("Created 'AGENTS.md'.");
    return;
  }

  const target = existingFiles[0];
  const updated = `${target.content.replace(/\s+$/, '')}\n\n${section}`;
  await writeFile(target.filePath, updated);
  context.logger.info(`Added a 'Lowdefy' section to '${target.fileName}'.`);
}

export default upsertAgentsMdSection;
