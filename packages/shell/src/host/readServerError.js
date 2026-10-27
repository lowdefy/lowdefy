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

/**
 * The error a non-2xx answer from the app's server carries, decoded as the core's requests decode
 * it (decodeErrorBody): a fault keeps its class, `requestId`, `handled` mark and dev error, and an
 * expected outcome (a 400, 401 or 403 the server answered as { name, message }) its class. Any other
 * answer (a gateway's page, a library's own body) is a plain Error with the body's message, or
 * `message`. Every error carries the HTTP `status`, so a caller can tell a refusal that will not
 * change from an outage.
 *
 * @param {Object} params
 * @param {Response} params.res The answer, not yet read.
 * @param {string} params.message The message for an answer that carries none.
 */
async function readServerError({ res, message }) {
  let body = null;
  try {
    body = await res.json();
  } catch (error) {
    // Not JSON: a host or gateway answered before the app did.
  }
  const error =
    decodeErrorBody(body) ?? new Error(type.isString(body?.message) ? body.message : message);
  error.status = res.status;
  return error;
}

export default readServerError;
