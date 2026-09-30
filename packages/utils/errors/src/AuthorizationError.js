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

// Thrown when an authenticated caller is refused by an authorization gate - the
// caller holds a session or a strategy credential but not the roles the
// request, endpoint, agent, websocket or auth step requires. Maps to 403. The
// message is written by the gate and may stay deliberately generic so it does
// not reveal what exists. The server error handlers branch on the name before
// the structured-log and Sentry pipeline: a caller with the wrong roles is
// expected traffic and produces one warning line, not an error log.
class AuthorizationError extends Error {
  constructor(message = 'Forbidden.', { cause } = {}) {
    super(message, { cause });
    this.name = 'AuthorizationError';
    this.isLowdefyError = true;
  }
}

export default AuthorizationError;
