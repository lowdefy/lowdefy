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

const MCP_SERVER_NAME = 'lowdefy-docs';
const POST_EDIT_HOOK_MATCHER = 'Edit|Write|MultiEdit';

export const POST_EDIT_HOOK_SCRIPT_PATH = path.join('.claude', 'hooks', 'lowdefy-build-status.mjs');

// $CLAUDE_PROJECT_DIR is exported into every hook process, so the command
// works from a worktree or a subdirectory session, where cwd is not the
// project root.
export const POST_EDIT_HOOK_COMMAND =
  'node "$CLAUDE_PROJECT_DIR/.claude/hooks/lowdefy-build-status.mjs"';

function enableMcpServer({ context, settings, settingsRelativePath }) {
  const enabled = type.isArray(settings.enabledMcpjsonServers)
    ? settings.enabledMcpjsonServers
    : [];
  if (enabled.includes(MCP_SERVER_NAME)) {
    context.logger.info(
      `'${settingsRelativePath}' already enables the '${MCP_SERVER_NAME}' MCP server - leaving it unchanged.`
    );
    return false;
  }
  settings.enabledMcpjsonServers = [...enabled, MCP_SERVER_NAME];
  context.logger.info(`Enabled the '${MCP_SERVER_NAME}' MCP server in '${settingsRelativePath}'.`);
  return true;
}

// A project's own PostToolUse groups are kept: the Lowdefy hook is added as
// its own matcher group, and is recognised on a rerun by its command, so the
// group survives a project renaming or reordering its matchers.
function addPostEditHook({ context, settings, settingsRelativePath }) {
  const hooks = type.isObject(settings.hooks) ? settings.hooks : {};
  const postToolUse = type.isArray(hooks.PostToolUse) ? hooks.PostToolUse : [];
  const alreadyThere = postToolUse.some(
    (group) =>
      type.isArray(group?.hooks) &&
      group.hooks.some((hook) => hook?.command === POST_EDIT_HOOK_COMMAND)
  );
  if (alreadyThere) {
    context.logger.info(
      `'${settingsRelativePath}' already runs the Lowdefy post-edit hook - leaving it unchanged.`
    );
    return false;
  }
  settings.hooks = {
    ...hooks,
    PostToolUse: [
      ...postToolUse,
      {
        matcher: POST_EDIT_HOOK_MATCHER,
        hooks: [{ type: 'command', command: POST_EDIT_HOOK_COMMAND, timeout: 15 }],
      },
    ],
  };
  context.logger.info(`Added the Lowdefy post-edit hook to '${settingsRelativePath}'.`);
  return true;
}

// Pre-approves the lowdefy-docs MCP server for Claude Code so no developer is
// prompted to trust it, and registers the post-edit hook that reports the dev
// server's build status after a config edit. Written to the committed
// '.claude/settings.json' rather than the gitignored
// '.claude/settings.local.json' on purpose, so the whole team inherits both
// from version control - which is why the hook itself must be silent when no
// dev server is running.
async function upsertClaudeSettings({ context, projectDirectory }) {
  const settingsRelativePath = path.join('.claude', 'settings.json');
  const settingsPath = path.join(projectDirectory, settingsRelativePath);
  const existing = await readFile(settingsPath);

  let settings = {};
  if (!type.isNone(existing)) {
    try {
      settings = JSON.parse(existing);
    } catch {
      context.logger.warn(
        `Could not parse existing '${settingsRelativePath}' as JSON - leaving it unchanged. Add '${MCP_SERVER_NAME}' to 'enabledMcpjsonServers' and the Lowdefy post-edit hook manually.`
      );
      return;
    }
  }

  const created = type.isNone(existing);
  const mcpChanged = enableMcpServer({ context, settings, settingsRelativePath });
  const hookChanged = addPostEditHook({ context, settings, settingsRelativePath });
  if (!created && !mcpChanged && !hookChanged) {
    return;
  }

  await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
  if (created) {
    context.logger.info(`Created '${settingsRelativePath}'.`);
  }
}

export default upsertClaudeSettings;
