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

// The engine-tier binding on the organization plugin's afterAcceptInvitation
// hook (an organizationHooks callback, not a database hook - it fires after
// the member row is created). An invitation created against an existing
// contact carries that contactId; accepting stamps it onto the user, making
// the contact link deterministic - no email re-matching for invited users.
// Merge-on-signup runs only for users with no contactId yet, so this
// invitation-carried link always wins.
function createAfterAcceptInvitationHook({ getAuth }) {
  return async function afterAcceptInvitationHook({ invitation, user }) {
    if (type.isNone(invitation.contactId)) {
      return;
    }
    const { internalAdapter } = await getAuth().$context;
    await internalAdapter.updateUser(user.id, { contactId: invitation.contactId });
  };
}

export default createAfterAcceptInvitationHook;
