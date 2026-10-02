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

import buildNpxMcpCommand from './buildNpxMcpCommand.js';
import findInstalledCli from '../../utils/findInstalledCli.js';
import findGitRoot from '../mcp/findGitRoot.js';

// Pins the app's own lowdefy version when it has `lowdefy mcp`, else the
// version of the CLI running agent-setup.
function resolveMcpCommand({ cliVersion, configDirectory }) {
  const installed = findInstalledCli({
    configDirectory,
    root: findGitRoot({ directory: configDirectory }),
  });
  const version = installed?.hasMcp ? installed.version : cliVersion;
  return {
    entry: buildNpxMcpCommand({ version }),
    installed: installed?.hasMcp === true,
    version,
  };
}

export default resolveMcpCommand;
