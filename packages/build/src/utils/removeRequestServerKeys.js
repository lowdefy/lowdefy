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

// The request artifact the server reads keeps these keys; the page artifact
// the client receives must not, so every writer calls this after it has
// serialized the request and before it serializes the page.
function removeRequestServerKeys({ request }) {
  delete request.properties;
  delete request.type;
  delete request.connectionId;
  delete request.auth;
  return request;
}

export default removeRequestServerKeys;
