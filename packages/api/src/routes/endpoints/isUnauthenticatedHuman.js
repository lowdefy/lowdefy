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

import { type } from '@lowdefy/helpers';

// True for a session-less caller on an app that has auth configured, outside a
// system run. This is the one caller who must get the same answer for a missing
// id as for a protected one - "authenticate" - or a logged-out client can
// enumerate endpoint ids by response difference (500/does-not-exist for a miss
// versus 401 for a protected id). "No user" is not enough on its own: it is also
// "no auth in this app" and "the engine talking to itself" (scheduled, webhook
// and detached runs), and neither should be told to authenticate against
// nothing. auth.json is a build artifact the build always writes.
async function isUnauthenticatedHuman({ readConfigFile, system, user }) {
  if (!type.isNone(user) || system === true) {
    return false;
  }
  const authConfig = await readConfigFile('auth.json');
  return authConfig?.configured === true;
}

export default isUnauthenticatedHuman;
