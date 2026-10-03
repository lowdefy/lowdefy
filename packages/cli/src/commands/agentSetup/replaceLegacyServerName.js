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

import { LEGACY_MCP_SERVER_NAMES, MCP_SERVER_NAME } from './mcpServerNames.js';

// The skill and AGENTS.md section earlier agent-setup runs wrote name the
// server by its old name. Only that phrase is rewritten, so whatever a person
// changed elsewhere in the file stands.
function replaceLegacyServerName(text) {
  return LEGACY_MCP_SERVER_NAMES.reduce(
    (current, legacy) =>
      current.replaceAll(`the \`${legacy}\` MCP server`, `the \`${MCP_SERVER_NAME}\` MCP server`),
    text
  );
}

export default replaceLegacyServerName;
