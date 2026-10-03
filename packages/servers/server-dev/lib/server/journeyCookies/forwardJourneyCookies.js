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

import JOURNEY_COOKIES from './JOURNEY_COOKIES.js';
import readJourneyCookie from './readJourneyCookie.js';
import { journeyActorToken } from '../auth/journeyActor.js';

// The Cookie header a detached loopback call carries, so its target runs with
// the same data set and mutant as the journey request that dispatched it. Only
// verified cookies are forwarded.
function forwardJourneyCookies(cookieHeader) {
  return Object.values(JOURNEY_COOKIES)
    .filter((cookie) => cookie.loopback)
    .map((cookie) => {
      const payload = readJourneyCookie({ cookieHeader, name: cookie.name });
      if (payload === null) {
        return null;
      }
      return `${cookie.name}=${journeyActorToken}.${payload}`;
    })
    .filter((pair) => pair !== null)
    .join('; ');
}

export default forwardJourneyCookies;
