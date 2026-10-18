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

import { parseCallerStamp } from '@lowdefy/helpers';

// The server refused a bearer host's session token with a 401: the session is
// gone (signed out elsewhere, ended by an admin, expired). The token is
// forgotten before the host hears of it, so nothing the host does next sends it
// again. A session token is never refused for a wrong password or code: Better
// Auth answers those with a 400, and its 401 credential refusals come from
// sign-in routes, which a shell calls only while it holds no token.
async function endBearerSession({ host, serverCaller }) {
  await host.tokenStore.clear();
  host.onCallerChanged(parseCallerStamp(serverCaller));
}

export default endBearerSession;
