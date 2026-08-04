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
import OrganizationKeyError from './OrganizationKeyError.js';

// Awaited by the request middleware before handlers run. The engine is
// constructed lazily on the first request, so that same request would
// otherwise race the startup ensure and read an unresolved pinned org.
// After the first resolution this awaits an already-settled memoized
// promise; the retained binding makes it a no-op read. A failed ensure is
// logged but not rethrown - the binding stays unresolved and the
// _organization operator / step organizationId defaulting fail with their
// own clear errors, instead of every request failing in the middleware. A
// mis-keyed organization row is the one exception; see the catch.
async function resolvePinnedOrganization({ auth, logger }) {
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
    // Transient versus configured. A briefly unreachable database must not log
    // the whole deployment out from the middleware, so those failures are
    // warned and retried on the next fire. An organization row keyed by the
    // wrong id is a permanent property of that database that never fixes
    // itself, and swallowing it produces one warn line and then the pinned
    // active-organization invariant refusing every session - the
    // deployment-wide sign-in page the check exists to replace. Failing every
    // request with a named configuration error is the kinder outcome.
    if (error instanceof OrganizationKeyError) {
      throw error;
    }
    // Retried on the next fire - ensureOrganization does not memoize failures.
    logger.warn(
      { err: error },
      `Failed to ensure the pinned organization "${registered.slug}" for the request.`
    );
  }
}

export default resolvePinnedOrganization;
