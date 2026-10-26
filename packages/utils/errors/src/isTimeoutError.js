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

// Codes a client sets when it gave up waiting: Node sockets, request, and undici's
// connect, headers and body timeouts.
const TIMEOUT_CODES = new Set([
  'ETIMEDOUT',
  'ESOCKETTIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
]);

// Names of the errors undici and AbortSignal.timeout throw when a call runs out of time.
const TIMEOUT_NAMES = new Set([
  'TimeoutError',
  'ConnectTimeoutError',
  'HeadersTimeoutError',
  'BodyTimeoutError',
]);

// Whether this one error is a call cancelled because it ran out of time. Read from the
// error's own name and code only; a message that mentions a timeout is not enough.
function isTimeoutError(error) {
  if (!error || typeof error !== 'object') return false;
  return TIMEOUT_NAMES.has(error.name) || TIMEOUT_CODES.has(error.code);
}

export default isTimeoutError;
