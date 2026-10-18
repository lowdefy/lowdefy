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

// A Lowdefy Dev link (lowdefy-dev://connect, lowdefy-dev://menu) is not a page path: Lowdefy Dev
// handles it (src/dev). A release shell has no developer features and routes every link.
import { redirectDevLink } from '../src/dev/index.js';

export function redirectSystemPath({ initial, path }) {
  return redirectDevLink ? redirectDevLink({ initial, path }) : path;
}
