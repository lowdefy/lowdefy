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

import createWireProjection from './createWireProjection.js';

// The text an MCP tool caller reads when an endpoint fails. A dev MCP client is a
// coding agent, a dev tool: the message carries the resolved config location and
// any hint so it can go straight to the yaml. A prod MCP client is an end-user
// reader and gets the wire message - the author's message or the generic one -
// so no library text or server path reaches it.
function formatErrorForAgent(context, error) {
  if (context.mode !== 'dev') {
    return createWireProjection(context)(error).message;
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
