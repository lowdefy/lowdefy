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

import dataSessionRegistry from './dataSessionRegistry.js';
import { JOURNEY_COOKIES, readJourneyCookie } from '../../server/journeyCookies.js';

// The data session a request's lowdefy_journey_data cookie names:
// - null when there is no cookie or its token is not this process's: not a journey's request, so it
//   reads the app's own database like any other;
// - the session while it is open or closing;
// - { ended: id } when the token verifies but the session is not open (closed, or never opened). A
//   verified token proves the request came from a journey, so the caller refuses it rather than let
//   it fall back to the real database.
function readDataSession(cookieHeader) {
  const id = readJourneyCookie({ cookieHeader, name: JOURNEY_COOKIES.data.name });
  if (type.isNone(id)) {
    return null;
  }
  const session = dataSessionRegistry.get(id);
  if (type.isNone(session) || (session.state !== 'open' && session.state !== 'closing')) {
    return { ended: id };
  }
  return session;
}

export default readDataSession;
