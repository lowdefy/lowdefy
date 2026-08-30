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
import { type } from '@lowdefy/helpers';

// The text an MCP tool caller reads when an endpoint fails. In dev the message
// carries the resolved config location and any hint, so an agent can go straight
// to the yaml. configDirectory is what distinguishes a dev server from production
// today (server-dev sets it, packages/servers/server never does - see
// normalizeErrorSources), and production keeps the bare message so no server
// path is ever handed to an MCP client.
function formatErrorForAgent(context, error) {
  if (type.isNone(context.configDirectory)) {
    return error.message;
  }
  let text = error.message;
  if (!type.isNone(error.source)) {
    text = `${text} (at ${error.source})`;
  }
  if (!type.isNone(error.hint)) {
    text = `${text} Hint: ${error.hint}`;
  }
  return text;
}

export default formatErrorForAgent;
