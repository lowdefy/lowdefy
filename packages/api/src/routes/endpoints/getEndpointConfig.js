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

import { AuthenticationError, ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// A missing endpoint id answers the same as a protected one for an anonymous
// human on an auth'd app: before you authenticate, the only answer is
// authenticate. Otherwise a logged-out caller enumerates endpoint ids by
// response difference - 500 for a miss (the handler special-cases only
// AuthenticationError) versus 401 for a protected one. An authenticated caller
// gets today's opaque "does not exist" for both a miss and a role refusal,
// unchanged.
//
// Guarded on authEnforcement != null (auth configured) and system !== true (not
// the engine talking to itself), exactly as the page fork is: "no user" is not
// "anonymous human who should sign in" - it is also "no auth here" and "this is
// a system run", and neither should be told to authenticate against nothing.
// This is NOT a per-entity apiProtectedByDefault default; no such glob surface
// exists.
async function getEndpointConfig(
  { authEnforcement, logger, readConfigFile, system, user },
  { endpointId }
) {
  const endpoint = await readConfigFile(`api/${endpointId}.json`);
  if (!endpoint) {
    const unauthenticatedHuman =
      type.isNone(user) && !type.isNone(authEnforcement) && system !== true;
    const err = unauthenticatedHuman
      ? new AuthenticationError(`Authentication required for API endpoint "${endpointId}".`)
      : new ConfigError(`API Endpoint "${endpointId}" does not exist.`);
    logger.debug({ params: { endpointId }, err }, err.message);
    throw err;
  }
  return endpoint;
}

export default getEndpointConfig;
