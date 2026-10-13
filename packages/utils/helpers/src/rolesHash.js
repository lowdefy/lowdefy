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

import stampHash from './stampHash.js';

// The stamp hash of a caller's roles in their active organization: the app
// roles (_user.roles, which page and endpoint auth gates match) and the
// organization role tier (_user.org_roles: owner, admin or member), since app
// config can gate blocks on either. Each list is sorted, so the same set always
// hashes the same, and the pair is JSON-encoded, so no separator inside a role
// can make two lists read as one. The server stamps it on every response
// (callerStamp) and the client compares it with the roles of the caller it
// renders, so both sides use this one function.
function rolesHash({ user }) {
  return stampHash(
    JSON.stringify({
      roles: [...(user.roles ?? [])].sort(),
      org_roles: [...(user.org_roles ?? [])].sort(),
    })
  );
}

export default rolesHash;
