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

import ensureOrganization from './ensureOrganization.js';
import { getRegisteredOrganization } from './getOrganizationBinding.js';

// Awaited by the request middleware before handlers run. The engine is
// constructed lazily on the first request, so that same request would
// otherwise race the startup ensure and read an unresolved pinned org.
// After the first resolution this awaits an already-settled memoized
// promise; the retained binding makes it a no-op read. A failed ensure is
// swallowed here - the binding stays unresolved and the _organization
// operator / step organizationId defaulting fail with their own clear
// errors, instead of every request failing in the middleware.
async function resolvePinnedOrganization({ auth }) {
  if (type.isNone(auth)) {
    return;
  }
  const registered = getRegisteredOrganization({ auth });
  if (
    type.isNone(registered) ||
    registered.policy !== 'pinned' ||
    registered.database !== true ||
    !type.isNone(registered.pinned)
  ) {
    return;
  }
  try {
    await ensureOrganization({ auth, slug: registered.slug });
  } catch (error) {
    // Retried on the next fire - ensureOrganization does not memoize failures.
  }
}

export default resolvePinnedOrganization;
