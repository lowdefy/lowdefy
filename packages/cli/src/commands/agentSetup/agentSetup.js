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

import { type } from '@lowdefy/helpers';

import findDevScripts from '../../utils/findDevScripts.js';
import findProjectRoot from './findProjectRoot.js';
import upsertAgentRulesBlock from './upsertAgentRulesBlock.js';
import upsertClaudeSettings from './upsertClaudeSettings.js';
import upsertMcpServer from './upsertMcpServer.js';
import skills from './skills/index.js';
import writeSkillFiles from './writeSkillFiles.js';

// Resolves where agent files should be written: the project root an agent is
// launched from, not the app config directory. The files name no app, so the
// app's place in the project is only logged.
function resolveDirectories({ context }) {
  const configDirectory = context.directories.config;
  const projectDirectory = context.options.projectDirectory
    ? path.resolve(context.options.projectDirectory)
    : findProjectRoot({ configDirectory });

  const relative = path.relative(projectDirectory, configDirectory);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    context.logger.warn(
      `Project directory '${projectDirectory}' does not contain the config directory '${configDirectory}' - writing agent files into the config directory instead.`
    );
    return { projectDirectory: configDirectory };
  }
  if (relative !== '') {
    context.logger.info(
      `Project root detected at '${projectDirectory}' - writing agent files there. The Lowdefy config is in '${relative
        .split(path.sep)
        .join('/')}/'.`
    );
  }
  return { projectDirectory };
}

// lowdefy mcp starts the dev server with the app's own dev script. When several
// scripts run `lowdefy dev` (debug logging, production secrets, ...) it will
// not guess - the app names one in cli.devScript.
function warnAmbiguousDevScript({ context }) {
  if (!type.isNone(context.cliConfig?.devScript)) {
    return;
  }
  const { matching } = findDevScripts({ configDirectory: context.directories.config });
  if (matching.length > 1) {
    context.logger.warn(
      `Several package.json scripts run "lowdefy dev" (${matching.join(
        ', '
      )}). Set cli.devScript in lowdefy.yaml to the one agents' dev servers should start with - lowdefy mcp will not guess.`
    );
  }
}

// The block and .mcp.json are stamped with this CLI's version. A different
// app version still gets them, with the command that makes the two match.
function warnVersionMismatch({ context }) {
  const { cliVersion, lowdefyVersion } = context;
  if (type.isNone(lowdefyVersion) || lowdefyVersion === cliVersion) {
    return;
  }
  context.logger.warn(
    `agent-setup is Lowdefy ${cliVersion}, this app runs ${lowdefyVersion}: run \`npx lowdefy@${lowdefyVersion} agent-setup\`.`
  );
}

async function agentSetup({ context }) {
  // Only apps inside the Lowdefy monorepo run on `lowdefy: local`. There the
  // block would land in the framework's own instructions, and .mcp.json has
  // no published version to pin.
  if (context.lowdefyVersion === 'local') {
    throw new Error("agent-setup does not support apps on 'lowdefy: local'. Nothing was written.");
  }
  context.logger.info('Setting up this project for AI coding agents.');

  const { projectDirectory } = resolveDirectories({ context });

  await upsertMcpServer({ context, projectDirectory });
  await upsertClaudeSettings({ context, projectDirectory });
  await writeSkillFiles({ context, projectDirectory, skills });
  await upsertAgentRulesBlock({ context, projectDirectory, skills });
  warnAmbiguousDevScript({ context });
  warnVersionMismatch({ context });

  await context.sendTelemetry();
  context.logger.info({ spin: 'succeed' }, 'Project set up for AI coding agents.');
}

export default agentSetup;
