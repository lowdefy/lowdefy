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
import { type } from '@lowdefy/helpers';

// The error message of an answer that is not ok, as the browser runner reads it: the app's error,
// decoded as the client decodes it, or the body's message when the app sent none. An answer the
// route gave 200 has none, even when an endpoint's routine failed: the client reads that from the
// body.
function readAnswerError({ body, status }) {
  if (status === 200) {
    return null;
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
