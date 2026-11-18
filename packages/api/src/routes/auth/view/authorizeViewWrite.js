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

import viewGrantCovers from './viewGrantCovers.js';

const VIEW_WRITE_REQUIRED = 'view_write_required';

// A view session never does more than the grant it was minted from allows:
// with mcp:read and no mcp:write it reads. A write it attempts is refused with
// the code view_write_required, the one refusal a view tells apart from every
// other, so it can ask the person to reconnect with write access.
//
// Called only once the caller's roles have allowed the thing itself, so the
// code confirms nothing the person could not already reach. With mcp:write the
// roles alone decide, and a caller that is not a view session is never
// refused here.
function authorizeViewWrite({ logger, viewSession }, { subject }) {
  if (type.isNone(viewSession)) {
    return;
  }
  if (viewGrantCovers({ viewSession, scope: 'mcp:write' })) {
    return;
  }
  logger.debug(
    { event: 'debug_view_write_refused', clientId: viewSession.clientId },
    `View session refused on ${subject}: its grant does not carry mcp:write.`
  );
  const error = new AuthorizationError(
    'This connection is read-only. Reconnect with write access to make changes.'
  );
  error.code = VIEW_WRITE_REQUIRED;
  throw error;
}

export default authorizeViewWrite;
export { VIEW_WRITE_REQUIRED };
