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

// Marks every string in its value as a credential: the server writes [REDACTED] in its place in
// every log line for the rest of the request. The value itself is returned unchanged.
function _credential({ markCredential, params }) {
  markCredential(params);
  return params;
}

_credential.dynamic = true;

export default _credential;
