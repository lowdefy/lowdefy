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

const BLOCK_BEGIN = '<!-- BEGIN:lowdefy-agent-rules';
const MARKER = /<!-- BEGIN:lowdefy-agent-rules\b([^>]*?)-->/;

// The nearest folder holding .git (a directory in a checkout, a file in a
// linked worktree), walking up from the config directory; outside git, the
// config directory. The same rule as the CLI's agentSetup/findProjectRoot.js,
// kept here because server-dev does not depend on the CLI.
function findProjectRoot(configDirectory) {
  let directory = configDirectory;
  for (;;) {
    if (fs.existsSync(path.join(directory, '.git'))) {
      return directory;
    }
    const parent = path.dirname(directory);
    if (parent === directory) {
      return configDirectory;
    }
    directory = parent;
  }
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

// The nearest AGENTS.md, then CLAUDE.md, holding Lowdefy's block, from the
// config directory up to the project root.
function findBlock({ configDirectory, projectRoot }) {
  let directory = configDirectory;
  for (;;) {
    for (const name of ['AGENTS.md', 'CLAUDE.md']) {
      const text = readText(path.join(directory, name));
      if (text?.includes(BLOCK_BEGIN)) {
        const attributes = text.match(MARKER)?.[1] ?? '';
        return {
          directory,
          name,
          version: attributes.match(/\bversion=(\S+)/)?.[1] ?? null,
        };
      }
    }
    if (directory === projectRoot) {
      return null;
    }
    const parent = path.dirname(directory);
    if (parent === directory) {
      return null;
    }
    directory = parent;
  }
}

function majorMinor(version) {
  const match = /^v?(\d+)\.(\d+)/.exec(version ?? '');
  return match ? `${match[1]}.${match[2]}` : null;
}

function hasClaudeImport(directory) {
  const text = readText(path.join(directory, 'CLAUDE.md'));
  return text !== null && text.split(/\r?\n/).some((line) => line.trim() === '@AGENTS.md');
}

function hasLowdefyMcpServer(projectRoot) {
  const text = readText(path.join(projectRoot, '.mcp.json'));
  if (text === null) {
    return false;
  }
  try {
    return Boolean(JSON.parse(text)?.mcpServers?.lowdefy);
  } catch {
    return false;
  }
}

// Checks Lowdefy's agent block that `lowdefy agent-setup` writes: missing,
// from a different major.minor version than the app runs, or in AGENTS.md
// while the CLAUDE.md beside it lacks its import. Returns notices for build status's
// agentFiles field, never build warnings. Only reads; computed on every call,
// since the root files are not watched.
function checkAgentFiles({ configDirectory, lowdefyVersion }) {
  if (typeof lowdefyVersion !== 'string' || lowdefyVersion === '') {
    return [];
  }
  const start = path.resolve(configDirectory);
  const projectRoot = findProjectRoot(start);
  const block = findBlock({ configDirectory: start, projectRoot });
  // agent-setup refuses `lowdefy: local` apps, so neither fix can run there.
  const local = lowdefyVersion === 'local';
  const notices = [];

  if (!block) {
    if (!local && hasLowdefyMcpServer(projectRoot)) {
      notices.push({
        code: 'block_missing',
        message: `Lowdefy's agent instructions are missing from AGENTS.md. Tell the developer; don't run agent-setup yourself. They add them with \`npx lowdefy@${lowdefyVersion} agent-setup\`.`,
      });
    }
    return notices;
  }

  const appMinor = majorMinor(lowdefyVersion);
  if (!local && appMinor !== null && majorMinor(block.version) !== appMinor) {
    const from = majorMinor(block.version)
      ? `Lowdefy ${block.version}`
      : 'an unknown Lowdefy version';
    notices.push({
      code: 'version_mismatch',
      message: `Agent instructions are from ${from}, this app runs ${lowdefyVersion}, so some of their guidance may not apply. Tell the developer; don't run agent-setup yourself. They fix it with \`npx lowdefy@${lowdefyVersion} agent-setup\`, unless another app in this repository runs a different version.`,
    });
  }

  // agent-setup writes CLAUDE.md beside the AGENTS.md it chose, and `@AGENTS.md`
  // resolves relative to the file holding it, so the import is looked for
  // there: the project root, or a --project-directory below it.
  if (block.name === 'AGENTS.md' && !hasClaudeImport(block.directory)) {
    notices.push({
      code: 'claude_import_missing',
      message:
        'Claude Code may not read AGENTS.md. Tell the developer: add `@AGENTS.md` to the top of CLAUDE.md, or run agent-setup.',
    });
  }
  return notices;
}

export default checkAgentFiles;
