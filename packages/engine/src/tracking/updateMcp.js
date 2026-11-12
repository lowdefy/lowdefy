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

import blocksReadChanges from './blocksReadChanges.js';
import readMcpDisplayMode from './readMcpDisplayMode.js';

// Runs when the MCP host a view is shown in reports a new context. It compares the display mode
// with the one the page last evaluated against and re-evaluates only the blocks that read
// _mcp: displayMode, so a host change to anything else evaluates nothing.
function updateMcp({ context }) {
  const { _internal } = context;
  const next = readMcpDisplayMode({ lowdefy: _internal.lowdefy });
  if (next === _internal.mcpDisplayMode) {
    return;
  }
  _internal.mcpDisplayMode = next;
  // With dependency tracking off no block records its reads, so any change needs a full pass.
  if (!_internal.DependencyTracker.isEnabled()) {
    _internal.update();
    return;
  }
  const changes = ['mcp:displayMode'];
  if (!blocksReadChanges({ context, changes })) {
    return;
  }
  _internal.update({ changes });
}

export default updateMcp;
