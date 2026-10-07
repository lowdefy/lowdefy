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

import collectStringLeaves from './collectStringLeaves.js';
import createValueScrubber from './createValueScrubber.js';
import credentialStorage from './credentialStorage.js';

// Every string in value is scrubbed from the log lines of the rest of the current scope.
function markCredential(value) {
  const scope = credentialStorage.getStore();
  if (scope === undefined) {
    throw new Error('A credential can only be marked while the server handles a request.');
  }
  scope.values.push(...collectStringLeaves(value));
  scope.scrub = createValueScrubber(scope.values);
}

export default markCredential;
