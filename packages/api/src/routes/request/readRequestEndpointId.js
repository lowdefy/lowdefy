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

// The endpoint whose routine holds a request. An endpoint step carries its own endpointId from the
// build, which differs from context.endpointId inside a nested CallApi: the context keeps the id of
// the endpoint the call came in on. Page and websocket requests hold none, so they take the
// context's (none on a page request).
function readRequestEndpointId(context, { requestConfig }) {
  return requestConfig.endpointId ?? context.endpointId;
}

export default readRequestEndpointId;
