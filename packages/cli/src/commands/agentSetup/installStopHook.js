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
import { readFile, writeFile } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import stopHookScript from './stopHookScript.js';

const hookRelativePath = path.join('.claude', 'hooks', 'lowdefy-feedback-stop.mjs');
const settingsRelativePath = path.join('.claude', 'settings.json');
const hookCommand = 'node .claude/hooks/lowdefy-feedback-stop.mjs';

function buildStopHookGroup() {
  return {
    matcher: '',
    hooks: [{ type: 'command', command: hookCommand }],
  };
}

// Detects an already-installed Lowdefy feedback hook by command substring,
// regardless of which matcher group it lives in, so a rerun never adds a
// second command entry.
function hasFeedbackStopHook(settings) {
  const stopGroups = settings?.hooks?.Stop ?? [];
  return stopGroups.some((group) =>
    (group.hooks ?? []).some((hook) => (hook.command ?? '').includes('lowdefy-feedback-stop.mjs'))
  );
}

async function writeHookScriptFile({ context, projectDirectory, port }) {
  const hookPath = path.join(projectDirectory, hookRelativePath);
  if (fs.existsSync(hookPath)) {
    context.logger.info(`'${hookRelativePath}' already exists - skipping.`);
    return;
  }

  await writeFile(hookPath, stopHookScript({ port }));
  context.logger.info(`Created '${hookRelativePath}'.`);
}

// Merges a Stop hook entry into an existing .claude/settings.json instead of
// overwriting it, since the file may already configure other hooks or
// settings for the project.
async function upsertSettingsJson({ context, projectDirectory }) {
  const settingsPath = path.join(projectDirectory, settingsRelativePath);
  const existing = await readFile(settingsPath);
  const hookGroup = buildStopHookGroup();

  if (type.isNone(existing)) {
    const settings = { hooks: { Stop: [hookGroup] } };
    await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
    context.logger.info(`Created '${settingsRelativePath}'.`);
    return;
  }

  let settings;
  try {
    settings = JSON.parse(existing);
  } catch {
    context.logger.warn(
      `Could not parse existing '${settingsRelativePath}' as JSON - leaving it unchanged. Add the Stop hook manually:\n` +
        JSON.stringify({ hooks: { Stop: [hookGroup] } }, null, 2)
    );
    return;
  }

  if (hasFeedbackStopHook(settings)) {
    context.logger.info(
      `'${settingsRelativePath}' already has the Lowdefy feedback Stop hook - leaving it unchanged.`
    );
    return;
  }

  settings.hooks = settings.hooks ?? {};
  settings.hooks.Stop = settings.hooks.Stop ?? [];
  settings.hooks.Stop.push(hookGroup);

  await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
  context.logger.info(`Added the Lowdefy feedback Stop hook to '${settingsRelativePath}'.`);
}

async function installStopHook({ context, projectDirectory, port }) {
  await writeHookScriptFile({ context, projectDirectory, port });
  await upsertSettingsJson({ context, projectDirectory });
}

export default installStopHook;
