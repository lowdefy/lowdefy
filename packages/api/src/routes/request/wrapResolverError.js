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
import { RequestError, ServiceError } from '@lowdefy/errors';

import summarisedError from './summarisedError.js';

// The interface layer's wrap of a connection's error, for a request step and a websocket source
// alike. The error that leaves here is logged whole at error level and sent to Sentry, so it
// carries ids (`fields`) and the connection's error summarised - never the evaluated properties
// (an agent chat's save-thread step holds the whole thread there) or the connection's error
// itself, which can embed the document it rejected. The dev tools still show that error: it is
// kept as devCause, which is not enumerable, so no log or error report walks it, and only the dev
// error payload reads it.
function wrapResolverError(error, { configKey, fields, location, service, typeName }) {
  const cause = summarisedError(error);
  let wrapped;
  if (ServiceError.isServiceError(error)) {
    // ServiceError reads the code, HTTP status, Retry-After and hint from its cause, wherever the
    // client put them, so it is built over the connection's error with only the message cut, then
    // given the summary as its cause. A Proxy, not a copy: a DOMException's fields are getters
    // that only work on the exception itself.
    wrapped = new ServiceError(undefined, {
      cause: new Proxy(error, {
        get: (target, key) => (key === 'message' ? cause.message : target[key]),
      }),
      service,
      configKey,
    });
    wrapped.cause = cause;
  } else {
    wrapped = new RequestError(cause.message, { cause, typeName, location, configKey });
    // A connection that refuses a request says what to do about it in `hint` (a MongoDB
    // duplicate key), which the summary does not keep.
    if (type.isString(error?.hint)) {
      wrapped.hint = error.hint;
    }
  }
  Object.assign(wrapped, fields);
  Object.defineProperty(wrapped, 'devCause', { value: error, configurable: true });
  return wrapped;
}

export default wrapResolverError;
