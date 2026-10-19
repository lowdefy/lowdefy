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

// Thrown when a request to a protected endpoint carries no successful
// authentication - the caller should fix its credentials (401). The server
// error handlers branch on the name before the structured-log and Sentry
// pipeline, so probing traffic produces a one-line warning, not error logs.
class AuthenticationError extends Error {
  constructor(message = 'Authentication required.', { cause } = {}) {
    super(message, { cause });
    this.name = 'AuthenticationError';
    this.isLowdefyError = true;
  }
}

export default AuthenticationError;
