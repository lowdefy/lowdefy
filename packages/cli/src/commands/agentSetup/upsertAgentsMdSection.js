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

// Sections written by agent-setup before `lowdefy mcp` told agents to start
// the dev server on a fixed port. They are replaced; a section a person wrote
// or rewrote is left alone.
const PORT_PINNED_SECTION_MARKER = '### Running the app';

function findLowdefySection(content) {
  const match = lowdefyHeadingPattern.exec(content);
  const start = match.index;
  const rest = content.slice(start + match[0].length);
  const next = /^##\s/m.exec(rest);
  const end = next === null ? content.length : start + match[0].length + next.index;
  return { start, end, text: content.slice(start, end) };
}

// Appends a "## Lowdefy" section to the project's existing agent instructions
// file instead of creating a competing one: an existing AGENTS.md wins, then
// an existing CLAUDE.md, and only when neither exists is an AGENTS.md
// created. Never overwrites — the file may already document the rest of the
// project.
async function upsertAgentsMdSection({ context, projectDirectory, appPath, devCommand }) {
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

  const section = agentsMd({ devCommand, appPath });

  const withSection = existingFiles.find((file) => lowdefyHeadingPattern.test(file.content));
  if (withSection) {
    const current = findLowdefySection(withSection.content);
    if (!current.text.includes(PORT_PINNED_SECTION_MARKER)) {
      context.logger.info(`'${withSection.fileName}' already has a 'Lowdefy' section - skipping.`);
      return;
    }
    const after = withSection.content.slice(current.end);
    const updated = `${withSection.content.slice(0, current.start)}${section}${
      after === '' ? '' : `\n${after}`
    }`;
    await writeFile(withSection.filePath, updated);
    context.logger.info(
      `Updated the 'Lowdefy' section in '${withSection.fileName}' for 'lowdefy mcp' (agents no longer start the dev server on a fixed port).`
    );
    return;
  }

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
