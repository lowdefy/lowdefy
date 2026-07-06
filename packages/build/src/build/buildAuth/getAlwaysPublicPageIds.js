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

// Page ids that are public in every protected/public mode without being
// listed as exceptions:
// - Pages holding an authPages role (hand-written, module-contributed or
//   default) - a sign-in page behind the wall is a bootstrap paradox, so a
//   role implies public. Role values are page paths ("/login"); stripping
//   the leading slash yields the page id ("login", "crm/login").
// - Module-contributed public pages (context.moduleAuthPublicPages) - they
//   behave as public exceptions but never join a protected list.
function getAlwaysPublicPageIds({ components, context }) {
  const rolePageIds = [];
  Object.entries(components.auth.authPages ?? {}).forEach(([role, value]) => {
    if (role.startsWith('~') || !type.isString(value)) {
      return;
    }
    rolePageIds.push(value.startsWith('/') ? value.slice(1) : value);
  });
  return [...rolePageIds, ...(context.moduleAuthPublicPages ?? [])];
}

export default getAlwaysPublicPageIds;
