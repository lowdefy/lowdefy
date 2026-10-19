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

import resolveAuthentication from '../../context/resolveAuthentication.js';

// Resolves the caller a websocket is acting for now, from the headers of its
// upgrade request - the session cookie, or the credentials an API strategy
// reads. Resolution runs on a separate object, so the connection's context
// keeps the caller it was opened with and the two can be compared.
//
// A context with no auth engine has a caller that was fixed when the context
// was built: no auth is configured, or the dev or e2e server injected a
// pre-resolved caller. There is no session to follow, so the caller stays.
async function resolveWebsocketCaller(context, { headers, strategies }) {
  if (type.isNone(context.auth)) {
    return context.user;
  }
  const resolved = { config: context.config, logger: context.logger };
  await resolveAuthentication(resolved, { auth: context.auth, headers, strategies });
  return resolved.user;
}

export default resolveWebsocketCaller;
