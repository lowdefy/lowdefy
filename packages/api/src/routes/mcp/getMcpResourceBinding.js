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

// The engine retains the MCP resource URI prefix per auth instance. The
// /api/mcp/:org bearer-token guard reads it synchronously at request time to
// test that a presented token's audience extends the deployment's prefix by
// exactly one org segment. Registered at startup only when the app is
// configured as an authorization server (auth.oauthProvider), so a null
// binding means the per-org MCP surface is off.
const bindingByAuth = new WeakMap();

function registerMcpResourceBinding({ auth, uriPrefix }) {
  bindingByAuth.set(auth, { uriPrefix });
}

function getMcpResourceBinding({ auth }) {
  if (type.isNone(auth)) {
    return null;
  }
  const binding = bindingByAuth.get(auth);
  if (type.isNone(binding)) {
    return null;
  }
  return { uriPrefix: binding.uriPrefix };
}

export { registerMcpResourceBinding };
export default getMcpResourceBinding;
