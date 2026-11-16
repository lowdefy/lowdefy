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

// What a caller gets from an endpoint. An InternalApi endpoint is never asked the gate: the
// endpoint route refuses it for every caller as if it did not exist (callEndpoint in
// @lowdefy/api), whatever its auth says, so the table answers deny. If it answered the gate's
// allow, making an internal endpoint callable would change nothing in the table.
function getEndpointOutcome({ authorizeOutcome, endpoint }) {
  if (endpoint.type === 'InternalApi') {
    return 'deny';
  }
  return authorizeOutcome(endpoint);
}

export default getEndpointOutcome;
