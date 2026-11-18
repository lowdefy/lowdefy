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

import readAnswerError from './readAnswerError.js';

// The error message of a webhook's answer, as expect.error reads it: none for an answer below
// 400; the message of the route's own error body, { error: { code, message } } (a failed verify
// gate, a :reject, a failed ValidateSchema step, a routine that failed); and for a webhook that
// threw before its routine (no such webhook endpoint), the error handler's message, as a call's.
function readWebhookError({ body, status }) {
  if (status < 400) {
    return null;
  }
  if (type.isString(body?.error?.message)) {
    return body.error.message;
  }
  return readAnswerError({ body, status });
}

export default readWebhookError;
