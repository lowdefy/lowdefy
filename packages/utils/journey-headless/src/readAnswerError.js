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

import { decodeErrorBody } from '@lowdefy/client-core';
import { serializer, type } from '@lowdefy/helpers';

// The error of a 200 answer whose routine failed (a :reject or :throw answers success: false
// with the routine's error), or null for one that succeeded, as the browser runner reads it.
function readRoutineError(body) {
  if (!type.isObject(body) || body.success !== false) {
    return null;
  }
  const { error } = serializer.deserialize(body);
  return error?.message ?? null;
}

// The error message of an answer, as the browser runner reads it: for a 200, the routine's error
// when it failed; otherwise the app's error, decoded as the client decodes it, or the body's
// message when the app sent none.
function readAnswerError({ body, status }) {
  if (status === 200) {
    return readRoutineError(body);
  }
  const decoded = type.isObject(body) ? decodeErrorBody(body) : null;
  if (decoded !== null) {
    return decoded.message;
  }
  if (type.isString(body?.message)) {
    return body.message;
  }
  return `${status}`;
}

export default readAnswerError;
