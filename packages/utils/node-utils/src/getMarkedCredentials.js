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

// The values marked so far in the current scope, so work the request hands to another request
// (a detached CallApi) can mark them there too. Outside any scope nothing has been marked.
function getMarkedCredentials() {
  const scope = credentialStorage.getStore();
  if (scope === undefined) {
    return [];
  }
  return [...scope.values];
}

export default getMarkedCredentials;
