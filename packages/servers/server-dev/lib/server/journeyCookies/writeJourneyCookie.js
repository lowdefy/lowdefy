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

import JOURNEY_COOKIES from './JOURNEY_COOKIES.js';
import { journeyActorToken } from '../auth/journeyActor.js';

const names = new Set(Object.values(JOURNEY_COOKIES).map((cookie) => cookie.name));

// The object a journey context passes to Playwright's context.addCookies.
// httpOnly, so page JavaScript cannot read the token. Lax, not Strict: a
// journey opens an emailed link from a data: URL, a cross-site navigation that
// a Strict cookie does not ride.
function writeJourneyCookie({ name, payload, origin }) {
  if (!names.has(name)) {
    throw new Error(`"${name}" is not a journey cookie.`);
  }
  if (!type.isString(payload)) {
    throw new Error(
      `Journey cookie payload must be a string. Received ${JSON.stringify(payload)}.`
    );
  }
  return {
    name,
    value: `${journeyActorToken}.${payload}`,
    url: origin,
    httpOnly: true,
    sameSite: 'Lax',
  };
}

export default writeJourneyCookie;
