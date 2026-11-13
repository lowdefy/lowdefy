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

// The display mode of the MCP host the page is shown in, as the _mcp operator reads it. Null where
// the page is not a view in a host.
function readMcpDisplayMode({ lowdefy }) {
  const mcp = lowdefy._internal?.mcp;
  if (type.isNone(mcp)) {
    return null;
  }
  return mcp.getDisplayMode();
}

export default readMcpDisplayMode;
