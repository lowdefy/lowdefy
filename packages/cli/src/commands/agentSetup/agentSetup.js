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
import getDevCommand from './getDevCommand.js';
import upsertAgentsMdSection from './upsertAgentsMdSection.js';
import upsertClaudeSettings from './upsertClaudeSettings.js';
import upsertMcpServer from './upsertMcpServer.js';
import writeSkillFile from './writeSkillFile.js';

// Resolves where agent files should be written (the project root an agent is
// launched from, not the app config directory) and the app's path relative
// to it, so generated instructions work from that root.
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
    return { projectDirectory: configDirectory, appPath: '' };
  }
  return { projectDirectory, appPath: relative.split(path.sep).join('/') };
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

async function agentSetup({ context }) {
  context.logger.info('Setting up this project for AI coding agents.');

  const { projectDirectory, appPath } = resolveDirectories({ context });
  if (appPath !== '') {
    context.logger.info(
      `Project root detected at '${projectDirectory}' - writing agent files there. The Lowdefy config is in '${appPath}/'.`
    );
  }
  const devCommand = getDevCommand({
    configDirectory: context.directories.config,
    projectDirectory,
  });
  const runCommand = appPath === '' ? devCommand : `cd ${appPath} && ${devCommand}`;

  await upsertMcpServer({ context, projectDirectory });
  await upsertClaudeSettings({ context, projectDirectory });
  await writeSkillFile({ context, projectDirectory, appPath });
  await upsertAgentsMdSection({ context, projectDirectory, appPath, devCommand: runCommand });
  warnAmbiguousDevScript({ context });

  await context.sendTelemetry();
  context.logger.info(
    'Annotate the app: press Cmd/Ctrl+/ in the browser to point, draw, and copy feedback, then paste it into your agent session.'
  );
  context.logger.info({ spin: 'succeed' }, 'Project set up for AI coding agents.');
}

export default agentSetup;
