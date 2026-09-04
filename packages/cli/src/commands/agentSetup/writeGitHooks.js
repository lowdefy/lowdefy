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
import { parseDocument } from 'yaml';
import { writeFile } from '@lowdefy/node-utils';

import getLowdefyCommand from './getLowdefyCommand.js';
import preCommitHookScript from './preCommitHookScript.js';
import writeHookScript from './writeHookScript.js';

const SCRIPT_RELATIVE_PATH = path.join('.claude', 'hooks', 'lowdefy-pre-commit.mjs');
const INVOCATION = 'node .claude/hooks/lowdefy-pre-commit.mjs';
const LEFTHOOK_FILENAMES = [
  'lefthook.yml',
  'lefthook.yaml',
  '.lefthook.yml',
  '.lefthook.yaml',
  'lefthook.local.yml',
];

function findLefthookConfig({ projectDirectory }) {
  return LEFTHOOK_FILENAMES.map((name) => path.join(projectDirectory, name)).find((filePath) =>
    fs.existsSync(filePath)
  );
}

// A husky or lefthook project manages its own hooks; writing .git/hooks there
// would either be overwritten by the manager or run twice.
async function wireLefthook({ context, configPath, projectDirectory }) {
  const relativePath = path.relative(projectDirectory, configPath);
  const document = parseDocument(fs.readFileSync(configPath, 'utf8'));
  if (document.errors.length > 0) {
    context.logger.warn(
      `Could not parse '${relativePath}' as YAML - leaving it unchanged. Add a pre-commit command running '${INVOCATION}' manually.`
    );
    return;
  }
  if (document.hasIn(['pre-commit', 'commands', 'lowdefy'])) {
    context.logger.info(
      `'${relativePath}' already runs the Lowdefy pre-commit hook - leaving it unchanged.`
    );
    return;
  }
  document.setIn(['pre-commit', 'commands', 'lowdefy', 'run'], INVOCATION);
  await writeFile(configPath, document.toString());
  context.logger.info(`Added the Lowdefy pre-commit command to '${relativePath}'.`);
}

async function wireHusky({ context, projectDirectory }) {
  const relativePath = path.join('.husky', 'pre-commit');
  const hookPath = path.join(projectDirectory, relativePath);
  const existing = fs.existsSync(hookPath) ? fs.readFileSync(hookPath, 'utf8') : '';
  if (existing.includes(INVOCATION)) {
    context.logger.info(
      `'${relativePath}' already runs the Lowdefy pre-commit hook - leaving it unchanged.`
    );
    return;
  }
  const separator = existing === '' || existing.endsWith('\n') ? '' : '\n';
  await writeFile(hookPath, `${existing}${separator}${INVOCATION}\n`);
  fs.chmodSync(hookPath, 0o755);
  context.logger.info(`Added the Lowdefy pre-commit hook to '${relativePath}'.`);
}

async function wireGitHook({ context, projectDirectory }) {
  const gitPath = path.join(projectDirectory, '.git');
  if (!fs.existsSync(gitPath) || !fs.statSync(gitPath).isDirectory()) {
    context.logger.warn(
      `No '.git' directory in '${projectDirectory}' - could not install the pre-commit hook. Run '${INVOCATION}' from your own pre-commit hook.`
    );
    return;
  }
  const relativePath = path.join('.git', 'hooks', 'pre-commit');
  const hookPath = path.join(gitPath, 'hooks', 'pre-commit');
  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, 'utf8');
    if (existing.includes(INVOCATION)) {
      context.logger.info(
        `'${relativePath}' already runs the Lowdefy pre-commit hook - leaving it unchanged.`
      );
      return;
    }
    context.logger.warn(
      `'${relativePath}' already exists - leaving it unchanged. Add this line to it:\n${INVOCATION}`
    );
    return;
  }
  await writeFile(hookPath, `#!/bin/sh\n${INVOCATION}\n`);
  fs.chmodSync(hookPath, 0o755);
  context.logger.info(`Created '${relativePath}'.`);
}

// Opt-in (--git-hooks): a hook that fails a commit is a bigger imposition than
// one that adds context to an agent's turn, so agent-setup never installs it
// without being asked.
async function writeGitHooks({ context, projectDirectory, appPath }) {
  await writeHookScript({
    context,
    projectDirectory,
    relativePath: SCRIPT_RELATIVE_PATH,
    content: preCommitHookScript({
      appPath,
      lowdefyCommand: getLowdefyCommand({
        configDirectory: context.directories.config,
        projectDirectory,
      }),
    }),
  });

  const lefthookConfigPath = findLefthookConfig({ projectDirectory });
  if (lefthookConfigPath) {
    await wireLefthook({ context, configPath: lefthookConfigPath, projectDirectory });
    return;
  }
  if (fs.existsSync(path.join(projectDirectory, '.husky'))) {
    await wireHusky({ context, projectDirectory });
    return;
  }
  await wireGitHook({ context, projectDirectory });
}

export default writeGitHooks;
