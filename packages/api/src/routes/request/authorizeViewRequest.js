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

import isViewPage from '../page/isViewPage.js';
import viewGrantCovers from '../auth/view/viewGrantCovers.js';

// A view session reaches a request only when the request's page is a view
// page. Checked before the request is looked up, and answered as a request the
// caller's roles refuse, so a view session cannot tell a request of another
// page from one that does not exist. A grant with no MCP scope reads nothing.
//
// A caller that is not a view session is never refused here.
async function authorizeViewRequest(
  { logger, readConfigFile, viewSession },
  { pageId, requestId }
) {
  if (type.isNone(viewSession)) {
    return;
  }
  const pageConfig = await readConfigFile(`pages/${pageId}.json`);
  if (isViewPage({ pageConfig }) && viewGrantCovers({ viewSession, scope: 'mcp:read' })) {
    return;
  }
  logger.debug(
    { event: 'debug_view_request_refused', pageId, requestId },
    `View session refused on request "${requestId}": page "${pageId}" is not a view page it may read.`
  );
  throw new AuthorizationError(`Request "${requestId}" does not exist.`);
}

export default authorizeViewRequest;
