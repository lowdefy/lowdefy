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

import originPort from './originPort.js';

// What a browser's host resolver rules and proxy switches depend on: the origin's host and port.
// http and https on one host and port share a browser; any other difference does not.
function originGuard({ origin }) {
  const url = new URL(origin);
  return `${url.hostname}:${originPort({ url })}`;
}

export default originGuard;
