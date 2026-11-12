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

import { AuthorizationError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import readViewReach from '../auth/view/readViewReach.js';
import viewGrantCovers from '../auth/view/viewGrantCovers.js';

// A view session opens only the websocket channels the build listed for a view
// page. Checked on the id alone, before the websocket is looked up, and
// answered as a websocket the caller's roles refuse, so a channel that is not
// listed and one that does not exist are the same answer. A grant with no MCP
// scope reaches nothing.
//
// A caller that is not a view session is never refused here.
async function authorizeViewWebsocket(context, { websocketId }) {
  const { logger, viewSession } = context;
  if (type.isNone(viewSession)) {
    return;
  }
  const { websockets } = await readViewReach(context);
  if (websockets.has(websocketId) && viewGrantCovers({ viewSession, scope: 'mcp:read' })) {
    return;
  }
  logger.debug(
    { event: 'debug_view_websocket_refused', websocketId },
    `View session refused on websocket "${websocketId}": no view page it may read lists it.`
  );
  throw new AuthorizationError(`Websocket "${websocketId}" does not exist.`);
}

export default authorizeViewWebsocket;
