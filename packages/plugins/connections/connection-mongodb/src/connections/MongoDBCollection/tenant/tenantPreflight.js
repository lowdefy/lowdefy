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

import getCollection from '../getCollection.js';

// The connection half of the tenant preflight capability (the API half is
// resolveTenantPreflight): probe one walled collection for unstamped rows.
// The wall filters every read on the tenant field, so under policy: tenant a
// document without it is silently invisible - the preflight turns that into
// a refusal to serve before any caller reads blanks.
//
// { [field]: null } matches documents missing the field AND documents
// carrying an explicit null - both are unstamped. An empty collection passes
// (a fresh tenant deployment has nothing to backfill). The probe stops at the
// first hit; on a fully-stamped collection it scans to prove the negative,
// so maxTimeMS bounds it - a timeout throws, which the caller treats as
// retryable rather than as a refusal.
async function tenantPreflight({ connection, field, maxTimeMS = 10000 }) {
  const { collection } = await getCollection({ connection });
  const unstamped = await collection.findOne(
    { [field]: null },
    { projection: { _id: 1 }, maxTimeMS }
  );
  return { ok: !unstamped };
}

export default tenantPreflight;
