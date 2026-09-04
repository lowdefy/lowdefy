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

import resolveDevUser from '../../../lib/server/auth/resolveDevUser.js';

// The headless page routes (screenshot, snapshot, inspect-state, load-state,
// eval-operator, journey) take the caller as a JSON string on the GET routes
// (query params are always strings) and as an object in the POST bodies, so
// both arrive here and every one of them answers a bad `user` with the same
// message. A string that does not start with `{` is a fixture name declared
// under auth.dev.users, resolved through resolveDevUser - the single resolver -
// so those routes only ever see a caller object. Returns { user } or { error }.
//
// The two execution routes (run-request, run-endpoint) do not use this: they
// hand the raw value to their runner, which resolves it once for both the REST
// and the MCP surface.
function parseUserParam({ value }) {
  if (type.isNone(value)) {
    return {};
  }

  let user = value;
  if (type.isString(value) && value.trimStart().startsWith('{')) {
    try {
      user = JSON.parse(value);
    } catch {
      return {
        error: `The "user" param must be JSON, e.g. {"roles":["admin"]}. Received ${JSON.stringify(
          value
        )}.`,
      };
    }
  }

  // resolveDevUser returns a caller object or throws - a name it does not know,
  // and any value that is neither a name nor an object, become the 400 message.
  try {
    return { user: resolveDevUser({ user }) };
  } catch (error) {
    return { error: error.message };
  }
}

export default parseUserParam;
