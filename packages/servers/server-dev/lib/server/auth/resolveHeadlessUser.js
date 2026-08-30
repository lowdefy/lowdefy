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

import { headlessUser } from './headlessUser.js';
import resolveDevUser from './resolveDevUser.js';

// The default headless caller is roleless, so role-gated pages and requests are
// refused for it. A per-call `user` merges over that default, which keeps the
// default id/name for the common `{ roles: [...] }` case while still allowing a
// full caller (email, profile, attributes) for config that reads those - nothing
// derives them for an injected caller, since no auth engine runs. Each headless
// call gets its own browser context and cookie jar, so callers do not share an
// identity. The `user` may also name a fixture declared under auth.dev.users -
// resolveDevUser turns either form into the caller object merged here.
function resolveHeadlessUser({ user }) {
  const resolved = resolveDevUser({ user });
  if (type.isNone(resolved)) {
    return headlessUser;
  }
  return { ...headlessUser, ...resolved };
}

export default resolveHeadlessUser;
