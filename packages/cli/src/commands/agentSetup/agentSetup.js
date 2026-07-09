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

import getDevCommand from './getDevCommand.js';
import upsertAgentsMdSection from './upsertAgentsMdSection.js';
import upsertMcpServer from './upsertMcpServer.js';
import writeSkillFile from './writeSkillFile.js';

async function agentSetup({ context }) {
  context.logger.info('Setting up this project for AI coding agents.');

  const port = context.options.port;
  const devCommand = getDevCommand({ configDirectory: context.directories.config });

  await upsertMcpServer({ context, port });
  await writeSkillFile({ context, port });
  await upsertAgentsMdSection({ context, port, devCommand });

  await context.sendTelemetry();
  context.logger.info({ spin: 'succeed' }, 'Project set up for AI coding agents.');
}

export default agentSetup;
