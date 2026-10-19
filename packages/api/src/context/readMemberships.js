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

// The adapter returns at most this many rows when asked for none; ask for more
// than any one person holds, so the read is one round trip in practice.
const MEMBER_ROWS_LIMIT = 1000;

// Reads every member row the person holds in one query, served by the unique
// { userId, organizationId } member index (ensureAuthIndexes), and picks the
// row in the active organization. The same read gives the ids of every
// organization they belong to, which the response stamp hashes (callerStamp),
// so the full identity costs no extra round trip.
//
// A person holding more rows than one read returns is not cut off: the active
// row is then read on its own, as before, and organizationIds is null - the
// list is incomplete, so the stamp leaves memberships out rather than hash a
// partial list.
async function readMemberships({ adapter, organizationId, userId }) {
  const rows = await adapter.findMany({
    model: 'member',
    where: [{ field: 'userId', value: userId }],
    limit: MEMBER_ROWS_LIMIT,
  });
  const member = rows.find((row) => row.organizationId === organizationId) ?? null;
  if (rows.length < MEMBER_ROWS_LIMIT) {
    return { member, organizationIds: rows.map((row) => row.organizationId) };
  }
  if (!type.isNone(member)) {
    return { member, organizationIds: null };
  }
  const activeMember = await adapter.findOne({
    model: 'member',
    where: [
      { field: 'userId', value: userId },
      { field: 'organizationId', value: organizationId },
    ],
  });
  return { member: activeMember, organizationIds: null };
}

export default readMemberships;
