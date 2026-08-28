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

// The engine-tier session.update.before hook that makes the accept-invitation
// route's active-organization set conditional. BetterAuth's accept route sets
// the accepting session's active organization unconditionally after minting
// the member row (crud-invites.mjs), which silently relocates a caller who was
// working in another organization - everything they create next lands in the
// inviter's workspace. The same set is also the only repair for an org-less
// session (the invited user who signed up directly holds a session with no
// active organization until they accept), so the set cannot simply be removed:
//
//   - session had no active organization -> let the set through (the rescue);
//   - session already active in an organization -> veto the write, so the
//     caller stays where they were. The member row is already minted by then,
//     so the new organization is joined either way - it just does not steal
//     focus. Switching is the caller's own, explicit act via
//     SetActiveOrganization.
//
// Scoped by endpoint path so the set-active-organization route - the explicit
// switch - is never touched, and keyed on activeOrganizationId so the team
// branch's activeTeamId session write passes through untouched. The current
// active organization is read from the endpoint's own resolved session
// (orgSessionMiddleware ran before the route body), not re-read from the
// database - it is the same session row the update targets.
function createAcceptActiveOrgGuardHook({ logger }) {
  return async function acceptActiveOrgGuardHook(data, ctx) {
    if (ctx?.path !== '/organization/accept-invitation') {
      return;
    }
    if (type.isNone(data?.activeOrganizationId)) {
      return;
    }
    const currentActiveOrganizationId = ctx?.context?.session?.session?.activeOrganizationId;
    if (type.isNone(currentActiveOrganizationId)) {
      return;
    }
    if (currentActiveOrganizationId === data.activeOrganizationId) {
      return;
    }
    logger.debug(
      `Invitation accept for organization "${data.activeOrganizationId}" left the session active in "${currentActiveOrganizationId}" - membership created, active organization unchanged.`
    );
    return false;
  };
}

export default createAcceptActiveOrgGuardHook;
