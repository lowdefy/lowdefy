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

import sentrySdk from './sentrySdk.js';

// Returns a function that runs a callback in the Sentry isolation scope current now, for work
// that is started later from outside this async context, such as a socket's messages, which
// arrive on its connection rather than in the upgrade that opened it.
function bindIsolationScope() {
  const Sentry = sentrySdk.current;
  if (!Sentry) {
    return function runUnbound(callback) {
      return callback();
    };
  }
  const isolationScope = Sentry.getIsolationScope();
  return function runInIsolationScope(callback) {
    return Sentry.withIsolationScope(isolationScope, callback);
  };
}

export default bindIsolationScope;
