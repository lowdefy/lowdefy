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

// The hub and MCP commands work across apps - from a repository root with no
// lowdefy.yaml, or in the background - so they skip runCommand's app start-up
// (lowdefy.yaml, version check, telemetry, and its logging to stdout, which
// `lowdefy mcp` reserves for the protocol).
function runHubCommand({ cliVersion, handler }) {
  return async function run(...args) {
    const command = args[args.length - 1];
    const directory = typeof args[0] === 'string' ? args[0] : undefined;
    try {
      await handler({ cliVersion, directory, ...command.opts() });
    } catch (error) {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
  };
}

export default runHubCommand;
