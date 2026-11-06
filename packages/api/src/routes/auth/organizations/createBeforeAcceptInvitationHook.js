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

import checkInvitationContactLink from './checkInvitationContactLink.js';

// The engine-tier binding on the organization plugin's beforeAcceptInvitation
// hook, which keeps the login's contactId a link that is set once
// (checkInvitationContactLink). It runs before BetterAuth moves the invitation
// off pending or writes the member row, so a refusal leaves nothing
// half-written - the invitation stays pending and no membership exists. The
// link itself is set by createAfterAcceptInvitationHook once the member row
// exists. An accept by someone already in the organization never reaches this
// hook; createAcceptExistingMemberHook makes the same check.
function createBeforeAcceptInvitationHook({ getAuth }) {
  return async function beforeAcceptInvitationHook({ invitation, user }) {
    const { adapter } = await getAuth().$context;
    await checkInvitationContactLink({ adapter, invitation, userId: user.id });
  };
}

export default createBeforeAcceptInvitationHook;
