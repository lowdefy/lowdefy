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

import createValueScrubber from './createValueScrubber.js';
import credentialStorage from './credentialStorage.js';

// Replaces the credentials marked in the current scope with [REDACTED]. A line written outside
// any scope (server start-up) has none to replace.
function scrubCredentials(value) {
  const scope = credentialStorage.getStore();
  if (scope === undefined) {
    return value;
  }
  if (scope.scrub === null) {
    scope.scrub = createValueScrubber([...scope.values]);
  }
  return scope.scrub(value);
}

export default scrubCredentials;
