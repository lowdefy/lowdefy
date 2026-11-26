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

const SHAPE =
  'The "user" param must be a user object (JSON on a query string), e.g. {"roles":["admin"]}, "none" to act signed out, or the name of a user in the data set the "data" param names.';

const SYSTEM_USER =
  'The "user" param can not carry "system": _user.system marks only the stand-in caller a CallApi "caller" names. A journey runs an endpoint as the system with a "call" step "as: system", or "as: { system: { organization, caller } }" for a run bound to an organization.';

// The server refuses an injected caller that carries "system" (normalizeInjectedCaller), so the
// routes refuse it as a bad param rather than fail inside the run.
function readUserObject(user) {
  if (Object.hasOwn(user, 'system')) {
    return { error: SYSTEM_USER };
  }
  return { user };
}

// The docs routes take the caller in the forms the MCP tools take (see
// lib/docs/resolveToolCaller.js): a user object - a JSON string on the GET
// routes, since query params are always strings, and an object in the POST
// bodies - "none", or a data set user name. Both arrive here, so every route
// answers a bad `user` with the same message. Returns { user } or { error }.
function parseUserParam({ value }) {
  if (type.isNone(value)) {
    return {};
  }
  if (type.isObject(value)) {
    return readUserObject(value);
  }
  if (!type.isString(value) || value === '') {
    return { error: `${SHAPE} Received ${JSON.stringify(value)}.` };
  }
  // A plain string is "none" or a data set user name; one that opens like JSON
  // is a user object written as a query param.
  if (!value.startsWith('{') && !value.startsWith('[')) {
    return { user: value };
  }
  let user;
  try {
    user = JSON.parse(value);
  } catch {
    return {
      error: `The "user" param must be JSON, e.g. {"roles":["admin"]}. Received ${JSON.stringify(
        value
      )}.`,
    };
  }
  if (!type.isObject(user)) {
    return { error: `${SHAPE} Received ${JSON.stringify(user)}.` };
  }
  return readUserObject(user);
}

export default parseUserParam;
