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

import summarisedError from './summarisedError.js';

// A connection that already typed its error (a ServiceError on a time limit, a ConfigError)
// passes through the interface layer without a new wrapper, which would nest causes. It still
// leaves with the step's ids and its cause summarised, like a wrapped error: the cause is the
// connection's own error, which can quote every document of a failed bulk write. Ids an inner
// step already set (an error from a nested CallApi) are kept, since they name where it failed,
// and a cause already summarised there keeps the devCause it was given.
function stampTypedError(error, { fields }) {
  Object.entries(fields).forEach(([key, value]) => {
    if (error[key] === undefined) {
      error[key] = value;
    }
  });
  if (error.devCause !== undefined || typeof error.cause?.message !== 'string') {
    return;
  }
  Object.defineProperty(error, 'devCause', { value: error.cause, configurable: true });
  error.cause = summarisedError(error.cause);
}

export default stampTypedError;
