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
import { getSessionFromCtx } from 'better-auth/api';
import { type } from '@lowdefy/helpers';

import readSuspendedOrganizationIds from './readSuspendedOrganizationIds.js';

// The engine-tier request hooks.after on /organization/list - the
// ListOrganizations action. The endpoint lists every organization the caller
// holds a member row in; an organization they are suspended in is one they do
// not belong to, so it is left out of the list, as it is left out of the
// caller stamp (readMemberships). Registered under tenant only: under pinned
// the endpoint is disabled.
function createSuspendedOrganizationsFilter() {
  return async function suspendedOrganizationsFilter(ctx) {
    const organizations = ctx.context.returned;
    if (!type.isArray(organizations)) {
      return undefined;
    }
    const session = await getSessionFromCtx(ctx);
    if (type.isNone(session)) {
      return undefined;
    }
    const suspendedOrganizationIds = await readSuspendedOrganizationIds({
      adapter: ctx.context.adapter,
      userId: session.user.id,
    });
    if (suspendedOrganizationIds.length === 0) {
      return undefined;
    }
    return ctx.json(
      organizations.filter((organization) => !suspendedOrganizationIds.includes(organization.id))
    );
  };
}

export default createSuspendedOrganizationsFilter;
