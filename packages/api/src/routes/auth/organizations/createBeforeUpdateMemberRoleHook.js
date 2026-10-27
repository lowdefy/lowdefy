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

import { APIError } from 'better-auth/api';

import isActiveMember from './isActiveMember.js';

// The engine-tier binding on the organization plugin's beforeUpdateMemberRole
// hook, which keeps a suspended member out of the owner tier. The plugin's
// owner guards (an admin cannot remove or demote an owner, the last owner
// cannot leave, be removed or demote themselves) count every owner row and know
// nothing of suspension. SuspendMember refuses an owner, and this refuses the
// other way in, so no suspended row holds owner and those counts stay exact.
// It runs inside the endpoint, so it covers the UpdateMemberOrgRole step and
// the tenant client call alike.
//
// newRole is the plugin's parsed role string, comma-separated when the
// request set several.
function createBeforeUpdateMemberRoleHook() {
  return async function beforeUpdateMemberRoleHook({ member, newRole }) {
    if (isActiveMember({ member })) {
      return undefined;
    }
    const roleNames = String(newRole)
      .split(',')
      .map((role) => role.trim());
    if (!roleNames.includes('owner')) {
      return undefined;
    }
    throw new APIError('BAD_REQUEST', {
      code: 'SUSPENDED_MEMBER_CANNOT_BE_OWNER',
      message: 'A suspended member cannot be made an owner. Unsuspend them first.',
    });
  };
}

export default createBeforeUpdateMemberRoleHook;
