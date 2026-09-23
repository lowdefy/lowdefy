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

import { readErrorCodes } from '@lowdefy/errors';

import lowdefyErrorTypes from './lowdefyErrorTypes.js';
import type from './type.js';

function identity(value) {
  return value;
}

function scrubDeep(value, scrub) {
  if (type.isString(value)) return scrub(value);
  if (type.isArray(value)) return value.map((item) => scrubDeep(item, scrub));
  if (type.isObject(value)) {
    const scrubbed = {};
    for (const [key, item] of Object.entries(value)) {
      scrubbed[key] = scrubDeep(item, scrub);
    }
    return scrubbed;
  }
  return value;
}

// Own-key lookup: an error named after an Object.prototype member, such as
// 'constructor', must fall back to Error rather than pick up that member.
function prototypeFor(name) {
  if (Object.hasOwn(lowdefyErrorTypes, name)) {
    return lowdefyErrorTypes[name].prototype;
  }
  return Error.prototype;
}

function projectNode(error, scrub, seen) {
  seen.add(error);
  const projected = Object.create(prototypeFor(error.name));

  // Non-enumerable, as on a constructed Error, so JSON.stringify skips it: an
  // `_error` sent to a plugin as data (an HTTP body, a database insert) then
  // carries no message. Assigning it would make it enumerable, which is also
  // why this does not go through serializer.copy.
  Object.defineProperty(projected, 'message', {
    value: scrub(error.message),
    enumerable: false,
    writable: true,
    configurable: true,
  });

  const { code, statusCode } = readErrorCodes(error);
  const fields = {
    name: error.name,
    code: type.isString(code) ? scrub(code) : code,
    statusCode,
    // The server's error sink sets `handled` once it has logged the error, and
    // the client skips reporting a handled error back to the server. A rethrown
    // `_error` without it would be logged a second time.
    handled: error.handled,
  };
  for (const [key, value] of Object.entries(fields)) {
    if (!type.isUndefined(value)) projected[key] = value;
  }

  const { cause } = error;
  if (type.isError(cause)) {
    if (!seen.has(cause)) projected.cause = projectNode(cause, scrub, seen);
  } else if (error.name === 'UserError') {
    // The author wrote a UserError's cause and metaData in config; any other
    // class's non-Error cause is library data, such as a response body.
    if (!type.isUndefined(cause)) projected.cause = scrubDeep(cause, scrub);
  }
  if (error.name === 'UserError' && !type.isUndefined(error.metaData)) {
    projected.metaData = scrubDeep(error.metaData, scrub);
  }

  return projected;
}

// The value `_error` reads: the caught error rebuilt with only the fields a
// routine or catch list branches on. `received`, `configKey`, `location`,
// `source`, `config` and `stack` are left out - `received` can hold a token
// fetched at runtime that the scrub does not know. The result is an Error, so
// wherever config sends it on, the serializer's wire policy applies to it.
function projectCaughtError(error, { scrub = identity } = {}) {
  if (!type.isError(error)) {
    return projectCaughtError(new Error(String(error)), { scrub });
  }
  return projectNode(error, scrub, new Set());
}

export default projectCaughtError;
