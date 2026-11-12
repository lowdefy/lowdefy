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

import { getViewHosts } from '@lowdefy/api';

import config from '../../lib/build/config.js';
import mcpJson from '../../lib/build/mcp.js';

// The exact origins this app's MCP App views run on: one per view host, and
// none for an app without a view. Everything on the server that admits a
// view's origin reads this list.
function getViewOrigins() {
  if (mcpJson.views.configured !== true) {
    return [];
  }
  return getViewHosts({ config }).map((host) => host.origin);
}

export default getViewOrigins;
