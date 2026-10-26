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

// The engine-tier binding on the organization plugin's beforeCreateInvitation
// hook, which enforces the cap on open invitations per organization. The
// plugin's own invitationLimit check cannot: it reads pending invitations with
// an unbounded findMany, which the adapter cuts to its default page of 100 rows
// before expired ones are filtered out in code. A limit above 100 is never
// reached, and expired rows inside that page hide open ones.
// buildOrganizationPlugin holds that check open, and this hook counts every
// pending, unexpired invitation of the organization instead.
//
// The hook runs after a re-invite has cancelled the address's earlier
// invitation, so the invitation being replaced is not counted. A resend
// refreshes an invitation without creating one and never reaches the hook.
function createBeforeCreateInvitationHook({ getAuth, invitationLimit }) {
  return async function beforeCreateInvitationHook({ organization }) {
    const { adapter } = await getAuth().$context;
    const openInvitations = await adapter.count({
      model: 'invitation',
      where: [
        { field: 'organizationId', value: organization.id },
        { field: 'status', value: 'pending' },
        { field: 'expiresAt', operator: 'gt', value: new Date() },
      ],
    });
    if (openInvitations >= invitationLimit) {
      throw new APIError('FORBIDDEN', {
        code: 'INVITATION_LIMIT_REACHED',
        message: 'This organization has reached its limit of open invitations.',
      });
    }
  };
}

export default createBeforeCreateInvitationHook;
