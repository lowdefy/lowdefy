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

import { LEGACY_MCP_SERVER_NAMES, MCP_SERVER_NAME } from './mcpServerNames.js';

// The server's old names become its new one, keeping each list's order.
function renameLegacy(list) {
  const renamed = list.map((name) =>
    LEGACY_MCP_SERVER_NAMES.includes(name) ? MCP_SERVER_NAME : name
  );
  return [...new Set(renamed)];
}

// Approvals and denials made under an old name carry over to the new one: a
// person who disabled lowdefy-docs keeps it disabled as lowdefy. The
// committed settings.json also enables the server, unless that file disables
// it, so the whole team inherits the approval from version control.
function migrateSettings({ settings, enable }) {
  const migrated = { ...settings };
  const disabled = type.isArray(settings.disabledMcpjsonServers)
    ? renameLegacy(settings.disabledMcpjsonServers)
    : undefined;
  let enabled = type.isArray(settings.enabledMcpjsonServers)
    ? renameLegacy(settings.enabledMcpjsonServers)
    : undefined;
  const isDisabled = disabled?.includes(MCP_SERVER_NAME) === true;
  if (isDisabled && !type.isUndefined(enabled)) {
    enabled = enabled.filter((name) => name !== MCP_SERVER_NAME);
  }
  if (enable && !isDisabled && !(enabled ?? []).includes(MCP_SERVER_NAME)) {
    enabled = [...(enabled ?? []), MCP_SERVER_NAME];
  }
  if (!type.isUndefined(enabled)) {
    migrated.enabledMcpjsonServers = enabled;
  }
  if (!type.isUndefined(disabled)) {
    migrated.disabledMcpjsonServers = disabled;
  }
  return migrated;
}

async function upsertSettingsFile({ context, projectDirectory, fileName, enable }) {
  const settingsRelativePath = path.join('.claude', fileName);
  const settingsPath = path.join(projectDirectory, settingsRelativePath);
  const existing = await readFile(settingsPath);

  if (type.isNone(existing)) {
    // settings.local.json is a person's own file: never created here.
    if (!enable) {
      return;
    }
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
      enable
        ? `Could not parse existing '${settingsRelativePath}' as JSON - leaving it unchanged. Add '${MCP_SERVER_NAME}' to 'enabledMcpjsonServers' manually.`
        : `Could not parse existing '${settingsRelativePath}' as JSON - leaving it unchanged. Rename '${LEGACY_MCP_SERVER_NAMES.join(
            "', '"
          )}' to '${MCP_SERVER_NAME}' in it manually.`
    );
    return;
  }

  const migrated = migrateSettings({ settings, enable });
  if (JSON.stringify(migrated) === JSON.stringify(settings)) {
    if (enable) {
      context.logger.info(
        `'${settingsRelativePath}' already ${
          migrated.disabledMcpjsonServers?.includes(MCP_SERVER_NAME) ? 'disables' : 'enables'
        } the '${MCP_SERVER_NAME}' MCP server - leaving it unchanged.`
      );
    }
    return;
  }
  await writeFile(settingsPath, `${JSON.stringify(migrated, null, 2)}\n`);
  context.logger.info(
    migrated.disabledMcpjsonServers?.includes(MCP_SERVER_NAME)
      ? `Kept the '${MCP_SERVER_NAME}' MCP server disabled in '${settingsRelativePath}' under its new name.`
      : `Enabled the '${MCP_SERVER_NAME}' MCP server in '${settingsRelativePath}'.`
  );
}

// Pre-approves the lowdefy MCP server for Claude Code so no developer is
// prompted to trust it. Written to the committed '.claude/settings.json'; the
// gitignored '.claude/settings.local.json' on this machine is only migrated
// from the server's old name, never created.
async function upsertClaudeSettings({ context, projectDirectory }) {
  await upsertSettingsFile({ context, projectDirectory, fileName: 'settings.json', enable: true });
  await upsertSettingsFile({
    context,
    projectDirectory,
    fileName: 'settings.local.json',
    enable: false,
  });
}

export default upsertClaudeSettings;
