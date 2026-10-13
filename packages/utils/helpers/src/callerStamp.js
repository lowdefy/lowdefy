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

import callerHash from './callerHash.js';
import listHash from './listHash.js';
import rolesHash from './rolesHash.js';
import stampHash from './stampHash.js';
import type from './type.js';

// The x-lowdefy-caller header value: who the server answered a page, request
// or endpoint call as, in full.
//
//   <caller>; session=<hash>; roles=<hash>; memberships=<hash>
//
// caller is callerHash (user and active organization), session the hash of the
// session id, roles the hash of the caller's roles in the active organization,
// memberships the hash of the ids of every organization the person is a member
// of. An anonymous caller is the empty string with no fields. A field the server
// does not know is left out: session for a caller with no session (an API
// strategy, an injected dev caller), memberships when the server did not read
// the person's member rows. parseCallerStamp reads it back.
//
// authSession is the session the caller was resolved from, as
// resolveAuthentication records it: { id, memberOrganizationIds }.
function callerStamp({ user, authSession }) {
  if (type.isNone(user)) {
    return '';
  }
  const parts = [callerHash({ user })];
  if (!type.isNone(authSession)) {
    parts.push(`session=${stampHash(authSession.id)}`);
  }
  parts.push(`roles=${rolesHash({ user })}`);
  if (!type.isNone(authSession?.memberOrganizationIds)) {
    parts.push(`memberships=${listHash({ values: authSession.memberOrganizationIds })}`);
  }
  return parts.join('; ');
}

export default callerStamp;
