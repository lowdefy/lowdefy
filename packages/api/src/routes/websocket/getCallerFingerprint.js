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

// The parts of a caller that decide what a websocket may deliver to it: who
// they are, the organization they act in and their roles. Other caller fields
// (name, attributes) may change without the socket needing to close.
//
// For a caller resolved from a view session the scopes of its grant are part of
// it: a grant narrowed to read while a socket is open must stop that socket
// publishing, and the socket carries the scopes it was opened with.
function getCallerFingerprint({ user, viewSession }) {
  if (type.isNone(user)) {
    return null;
  }
  const fingerprint = {
    id: user.id ?? null,
    organizationId: user.organization_id ?? null,
    roles: [...(user.roles ?? [])].sort(),
  };
  if (!type.isNone(viewSession)) {
    fingerprint.viewScopes = [...viewSession.grantedScopes].sort();
  }
  return JSON.stringify(fingerprint);
}

export default getCallerFingerprint;
