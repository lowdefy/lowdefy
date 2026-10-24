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

// A phone paired with `lowdefy dev --lan` sends the session's pairing token in
// this header on every request.
const pairHeader = 'x-lowdefy-pair';

// Set by the manager's proxy, never by a caller (the proxy removes any a
// caller sends): the request came from another machine and carried the
// pairing token. Dev tools and the headless user refuse such a request.
const remoteCallerHeader = 'x-lowdefy-dev-remote';

export { pairHeader, remoteCallerHeader };
