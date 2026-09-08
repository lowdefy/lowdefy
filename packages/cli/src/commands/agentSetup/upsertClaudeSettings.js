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

// Pre-approves the lowdefy-docs MCP server for Claude Code so no developer is
// prompted to trust it. Written to the committed '.claude/settings.json'
// rather than the gitignored '.claude/settings.local.json' on purpose, so the
// whole team inherits the approval from version control.
async function upsertClaudeSettings({ context, projectDirectory }) {
  const settingsRelativePath = path.join('.claude', 'settings.json');
  const settingsPath = path.join(projectDirectory, settingsRelativePath);
  const existing = await readFile(settingsPath);

  if (type.isNone(existing)) {
    const settings = { enabledMcpjsonServers: [MCP_SERVER_NAME] };
    await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
    context.logger.info(`Created '${settingsRelativePath}'.`);
    return;
  }

  let settings;
  try {
    settings = JSON.parse(existing);
  } catch {
    context.logger.warn(
      `Could not parse existing '${settingsRelativePath}' as JSON - leaving it unchanged. Add '${MCP_SERVER_NAME}' to 'enabledMcpjsonServers' manually.`
    );
    return;
  }

  const enabled = type.isArray(settings.enabledMcpjsonServers)
    ? settings.enabledMcpjsonServers
    : [];
  if (enabled.includes(MCP_SERVER_NAME)) {
    context.logger.info(
      `'${settingsRelativePath}' already enables the '${MCP_SERVER_NAME}' MCP server - leaving it unchanged.`
    );
    return;
  }

  settings.enabledMcpjsonServers = [...enabled, MCP_SERVER_NAME];
  await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
  context.logger.info(`Enabled the '${MCP_SERVER_NAME}' MCP server in '${settingsRelativePath}'.`);
}

export default upsertClaudeSettings;
