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

import { decodeServerError } from '@lowdefy/engine';
import { isExpectedError, lowdefyErrorTypes } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// The error a non-2xx JSON body from the app's server carries, or null when it
// carries none (a host's or a library's own answer). A fault comes as a
// serialized error (`~e`), decoded with its dev error and `handled` mark. The
// server answers an expected outcome (an auth gate's 401 or 403, a UserError's
// 400) itself, as { name, message } with no serialized error; rebuilding its
// class keeps the name the engine, handleError and the dev tools tell an
// expected outcome from a fault by. The server sends a code beside them only
// for a refusal a client acts on (view_write_required), and the error keeps it.
function decodeErrorBody(body) {
  if (body?.['~e']) {
    return decodeServerError(body);
  }
  if (isExpectedError(body)) {
    const ExpectedError = lowdefyErrorTypes[body.name];
    const error = new ExpectedError(body.message);
    if (type.isString(body.code)) {
      error.code = body.code;
    }
    return error;
  }
  return null;
}

export default decodeErrorBody;
