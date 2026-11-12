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

import { VIEW_SESSIONS_PER_GRANT } from './viewSessionLimits.js';

// Holds a grant to VIEW_SESSIONS_PER_GRANT view sessions, called after each
// mint: the newest are kept and every older one is deleted. Every view session
// has the same lifetime, so an older one always expires first - keeping the
// newest rows never ends a live session while an expired one is kept, and the
// rows left behind by views that closed are cleared on the grant's next mint.
async function pruneViewSessions({ adapter, clientId, internalAdapter, organizationId, userId }) {
  const stale = await adapter.findMany({
    model: 'session',
    where: [
      { field: 'userId', value: userId },
      { field: 'view', value: true },
      { field: 'viewClientId', value: clientId },
      { field: 'activeOrganizationId', value: organizationId },
    ],
    sortBy: { field: 'createdAt', direction: 'desc' },
    offset: VIEW_SESSIONS_PER_GRANT,
  });
  for (const session of stale) {
    await internalAdapter.deleteSession(session.token);
  }
  return stale.length;
}

export default pruneViewSessions;
