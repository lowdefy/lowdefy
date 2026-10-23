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

import { normalizeCaller, type } from '@lowdefy/helpers';

// The caller Session renders, from the BetterAuth store's session and the last
// server-resolved caller.
//
// The page renders only a caller the server resolved. Every response names the
// caller the server answered as (x-lowdefy-caller), and a page rendering
// another caller reloads (shouldReloadForCaller). A session the server resolves
// to no caller - a removed member, an invitee whose invitation lapsed - renders
// as no caller, not as the session's user: rendering the session's user would
// mismatch every response and reload until the loop guard throws.
//
// Only the session half is passed through normalizeCaller. BetterAuth's store
// returns camelCase keys whatever the columns are named, so untransformed it
// would sit emailVerified beside the resolved caller's email_verified on one
// object; anything arriving from the server is already snake_case.
function sessionCaller({ isPending, resolvedUser, session }) {
  if (isPending) {
    return resolvedUser;
  }
  if (type.isNone(session?.user) || type.isNone(resolvedUser)) {
    return null;
  }
  if (resolvedUser.id !== session.user.id) {
    // The session names another person than the resolved caller; Session
    // reloads the page. Until it unloads, render the last resolved caller whole
    // rather than mixing the new session user with the previous person's
    // resolved fields - blocks re-evaluate operators on render, so a
    // role-guarded page would act on a mixed caller.
    return resolvedUser;
  }
  // _user is one object with one meaning on both sides: the resolved caller is
  // spread whole, so every field resolveAuthentication emits is readable in app
  // config without this file naming it. session.user is the floor - the client
  // store may hold a fresher one than the resolved state, and the resolved
  // object wins wherever both carry a key.
  return { ...normalizeCaller(session.user), ...resolvedUser };
}

export default sessionCaller;
