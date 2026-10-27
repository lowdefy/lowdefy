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

const BEGIN_PATTERN = /^<!-- BEGIN:lowdefy-agent-rules(?: version=\S*)? -->[^\S\n]*$/m;
const END_MARKER = '<!-- END:lowdefy-agent-rules -->';
const IMPORT_LINE = '@AGENTS.md';
const IMPORT_PATTERN = /^\s*@AGENTS\.md\s*$/m;

function renderBlock({ cliVersion, skills }) {
  return `<!-- BEGIN:lowdefy-agent-rules version=${cliVersion} -->
${agentsMd({ cliVersion, skills }).trimEnd()}
${END_MARKER}
`;
}

// The block's span in a file: from its BEGIN marker to the end of the line
// holding its END marker. null when the file holds no block; { broken: true }
// when BEGIN has no END after it.
function findBlock(content) {
  const begin = BEGIN_PATTERN.exec(content);
  if (begin === null) {
    return null;
  }
  const endIndex = content.indexOf(END_MARKER, begin.index);
  if (endIndex === -1) {
    return { broken: true };
  }
  let end = endIndex + END_MARKER.length;
  if (content[end] === '\n') end += 1;
  return { start: begin.index, end };
}

async function readCandidate({ projectDirectory, fileName }) {
  const filePath = path.join(projectDirectory, fileName);
  const content = await readFile(filePath);
  return { fileName, filePath, content: type.isNone(content) ? null : content };
}

// Claude Code skips AGENTS.md whenever it finds a Claude file, so the root
// CLAUDE.md imports it. .claude/CLAUDE.md (where the line would resolve to
// .claude/AGENTS.md) and CLAUDE.local.md (personal) are never touched.
async function ensureClaudeImport({ context, claudeMd }) {
  if (claudeMd.content === null) {
    await writeFile(claudeMd.filePath, `${IMPORT_LINE}\n`);
    context.logger.info("Created 'CLAUDE.md' importing 'AGENTS.md'.");
    return;
  }
  if (IMPORT_PATTERN.test(claudeMd.content)) {
    return;
  }
  await writeFile(claudeMd.filePath, `${IMPORT_LINE}\n\n${claudeMd.content}`);
  context.logger.info("Added '@AGENTS.md' to the top of 'CLAUDE.md' so Claude Code reads it.");
}

// Keeps Lowdefy's guidance as one block between BEGIN/END markers, stamped
// with the version of the CLI that wrote it, and rewrites the whole block on
// every run. Text outside the markers is never touched. An existing block is
// replaced where it is; otherwise the block is appended to AGENTS.md, else to
// CLAUDE.md, else a new AGENTS.md holds it.
async function upsertAgentRulesBlock({ context, projectDirectory, skills }) {
  const agentsMdFile = await readCandidate({ projectDirectory, fileName: 'AGENTS.md' });
  const claudeMd = await readCandidate({ projectDirectory, fileName: 'CLAUDE.md' });
  const block = renderBlock({ cliVersion: context.cliVersion, skills });

  const holder = [agentsMdFile, claudeMd].find(
    (file) => file.content !== null && findBlock(file.content) !== null
  );
  let target;
  if (holder) {
    target = holder;
    const span = findBlock(holder.content);
    if (span.broken) {
      context.logger.warn(
        `'${holder.fileName}' has a 'BEGIN:lowdefy-agent-rules' marker with no '${END_MARKER}' after it - leaving it unchanged. Add the END marker or remove the BEGIN marker, then rerun agent-setup.`
      );
      return;
    }
    const updated = `${holder.content.slice(0, span.start)}${block}${holder.content.slice(
      span.end
    )}`;
    if (updated === holder.content) {
      context.logger.info(`The Lowdefy block in '${holder.fileName}' is up to date.`);
    } else {
      await writeFile(holder.filePath, updated);
      context.logger.info(`Updated the Lowdefy block in '${holder.fileName}'.`);
    }
  } else {
    target = agentsMdFile.content === null && claudeMd.content !== null ? claudeMd : agentsMdFile;
    if (target.content === null) {
      await writeFile(target.filePath, block);
      context.logger.info(`Created '${target.fileName}'.`);
    } else {
      const before = target.content.trimEnd();
      await writeFile(target.filePath, before === '' ? block : `${before}\n\n${block}`);
      context.logger.info(`Added the Lowdefy block to '${target.fileName}'.`);
    }
  }

  if (target.fileName === 'AGENTS.md') {
    await ensureClaudeImport({ context, claudeMd });
  }
}

export default upsertAgentRulesBlock;
