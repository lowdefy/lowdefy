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

import { TenantIntegrityError } from '@lowdefy/errors';

// The write-side backstop of the tenant wall: every row a request INSERTS into
// a walled collection is read back as stored and checked. The stamp and the
// unscoped-write guard reason about what the request asked for; this checks
// what the database actually holds, so a bug or an exotic operator path in
// them can never leave an org-less or wrong-org row behind - a row the wall
// hides from every organisation.
//
// The read-back is by _id only and deliberately NOT tenant-filtered: the row it
// looks for may be exactly the one the wall would hide. A row that fails is
// deleted (it is invisible to every read anyway) and the request fails with a
// TenantIntegrityError naming the request, the collection, the field and the
// organisation.
//
// Under a scoped request (tenant = { field, value }) the stored value must
// equal the caller's organisation. Under the write guard of a tenant: shared
// connection (tenant = null) the app authors the value, so it must at least be
// a non-empty string. With neither, the request is not walled and this is a
// no-op.

function isOrganizationId(value) {
  return typeof value === 'string' && value !== '';
}

function toArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

// The driver reports bulk-style ids as an index -> _id map
// ({ 0: id, 3: id }); a single write reports one id or nothing.
function idsOfMap(map) {
  return map && typeof map === 'object' ? Object.values(map) : [];
}

async function verifyStoredTenant({
  collection,
  connectionId,
  endpointId,
  ids,
  requestId,
  requestType,
  tenant,
  tenantGuard,
}) {
  const field = tenant?.field ?? tenantGuard?.field;
  if (!field) return;
  const insertedIds = toArray(ids).filter((id) => id !== undefined && id !== null);
  if (insertedIds.length === 0) return;
  const expected = tenant?.value ?? null;
  const rows = await collection
    .find({ _id: { $in: insertedIds } }, { projection: { [field]: 1 } })
    .toArray();
  const readField = (row) =>
    field.split('.').reduce((node, key) => (node == null ? undefined : node[key]), row);
  const offenders = rows.filter((row) => {
    const stored = readField(row);
    return !isOrganizationId(stored) || (expected !== null && stored !== expected);
  });
  if (offenders.length === 0) return;
  await collection.deleteMany({ _id: { $in: offenders.map((row) => row._id) } });
  const collectionName = collection.collectionName ?? null;
  throw new TenantIntegrityError(
    `${requestType ?? 'Write'} request "${
      requestId ?? connectionId
    }" (connection "${connectionId}") stored ${
      offenders.length === 1 ? 'a row' : `${offenders.length} rows`
    } in collection "${collectionName}" whose "${field}" is ${
      expected !== null ? `not the requesting organisation "${expected}"` : 'missing or empty'
    }. ${
      offenders.length === 1 ? 'The row was' : 'The rows were'
    } removed so the wall does not hide ${
      offenders.length === 1 ? 'it' : 'them'
    } from every organisation; the write did not take effect.`,
    {
      collection: collectionName,
      connectionId,
      endpointId,
      field,
      organizationId: expected,
    }
  );
}

export { idsOfMap };
export default verifyStoredTenant;
