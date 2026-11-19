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

// A view session calls only the endpoints the build listed for a view page.
// Checked on the id alone, before the endpoint is looked up, and answered as
// an endpoint the caller's roles refuse: an endpoint that is not listed and
// one that does not exist are the same answer. An MCP tool that no view page
// calls is refused here too, though the same grant may call it over /api/mcp.
//
// Returns whether the endpoint writes - its scope is mcp:write - for the write
// check that follows the role check (authorizeViewWrite). A grant with no MCP
// scope reaches nothing.
//
// This is the check of the endpoint route alone. An endpoint that a listed
// endpoint's routine calls, or a websocket's check endpoint, is the app's own
// call and is not held to the list.
//
// A caller that is not a view session is never refused here.
async function authorizeViewEndpoint(context, { endpointId }) {
  const { logger, viewSession } = context;
  if (type.isNone(viewSession)) {
    return { writes: false };
  }
  const { endpoints } = await readViewReach(context);
  if (endpoints.has(endpointId) && viewGrantCovers({ viewSession, scope: 'mcp:read' })) {
    return { writes: endpoints.get(endpointId) !== 'mcp:read' };
  }
  logger.debug(
    { event: 'debug_view_endpoint_refused', endpointId },
    `View session refused on API endpoint "${endpointId}": no view page it may read lists it.`
  );
  throw new AuthorizationError(`API Endpoint "${endpointId}" does not exist.`);
}

export default authorizeViewEndpoint;
