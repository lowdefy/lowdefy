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

import credentialStorage from './credentialStorage.js';
import scrubCredentials from './scrubCredentials.js';

// Returns a scrub for the current scope's marked credentials that keeps working after the scope
// has ended, for work a request leaves behind, such as the Sentry transaction sent once the
// response is written. Values marked later in the scope are scrubbed too.
function bindCredentialScrub() {
  const scope = credentialStorage.getStore();
  return function scrubBoundCredentials(value) {
    return scrubCredentials(value, scope);
  };
}

export default bindCredentialScrub;
