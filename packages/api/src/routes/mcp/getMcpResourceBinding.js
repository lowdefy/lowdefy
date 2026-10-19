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

// The engine retains the MCP resource URI per auth instance. The /api/mcp
// bearer-token guard reads it synchronously at request time as the audience
// a presented token must carry, and the resource-row ensure reads it as the
// row identifier. Registered at startup only when the app is configured as an
// authorization server (auth.oauthProvider), so a null binding means the MCP
// OAuth surface is off.
const bindingByAuth = new WeakMap();

function registerMcpResourceBinding({ auth, resourceUri }) {
  bindingByAuth.set(auth, { resourceUri });
}

function getMcpResourceBinding({ auth }) {
  if (type.isNone(auth)) {
    return null;
  }
  const binding = bindingByAuth.get(auth);
  if (type.isNone(binding)) {
    return null;
  }
  return { resourceUri: binding.resourceUri };
}

export { registerMcpResourceBinding };
export default getMcpResourceBinding;
