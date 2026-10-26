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

// The Authorization header a call carries: the session token for a bearer host
// that holds one, else none. A cookie host's browser sends the session cookie
// itself, so its calls carry no header here.
function getAuthorizationHeaders({ host }) {
  if (host.authTransport !== 'bearer') {
    return {};
  }
  const token = host.tokenStore.get();
  if (type.isNone(token)) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}

export default getAuthorizationHeaders;
