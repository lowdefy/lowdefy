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

const validProperties = ['displayMode', 'embedded'];

// mcp is what the client knows about the MCP host a page runs in as a view (the client's
// createMcp). A page in a browser tab or a native shell has none, and every key reads null there.
function _mcp({ mcp, params }) {
  if (!validProperties.includes(params)) {
    throw new Error(`_mcp only returns values for ${validProperties.join(', ')}.`);
  }
  if (type.isNone(mcp)) {
    return null;
  }
  if (params === 'embedded') {
    return true;
  }
  return mcp.getDisplayMode();
}

_mcp.dynamic = true;
// A page is inside a host or not for as long as it lives. The host changes the display mode while
// the page is shown, and the client reports mcp:displayMode when it does (the engine's updateMcp).
_mcp.tracking = ({ params }) =>
  params === 'displayMode' ? { kind: 'read', keys: ['mcp:displayMode'] } : { kind: 'pure' };

export default _mcp;
