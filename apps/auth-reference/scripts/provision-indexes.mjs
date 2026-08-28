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

/*
  Provisions the documented auth index requirements (mongodb/design.md
  Decision 3). The Lowdefy server never creates indexes - the deployment
  applies them; this script is that step for the reference app.

  Usage: AUTH_DATABASE_URI='mongodb://...' node scripts/provision-indexes.mjs
*/

import { MongoClient } from 'mongodb';

const uri = process.env.AUTH_DATABASE_URI;
if (!uri) {
  console.error('Set AUTH_DATABASE_URI to the auth database connection string.');
  process.exit(1);
}

// The documented index requirements. The member/invitation/organization
// collections are created by phase 3 flows; provisioning their indexes up
// front is harmless and keeps this script the single list.
const indexes = [
  { collection: 'users', keys: { email: 1 }, options: { unique: true } },
  // Partial unique: one account per phone where a phone exists - a plain
  // unique index would reject the second phone-less user. Also load-bearing
  // for the per-sign-in phone_number lookup.
  {
    collection: 'users',
    keys: { phone_number: 1 },
    options: { unique: true, partialFilterExpression: { phone_number: { $exists: true } } },
  },
  // Module-owned, and partial for the same reason as phone_number: the link is
  // optional, so a plain unique index would reject the second unlinked user.
  // Unique where present is what makes the merge-on-signup match one-to-one -
  // two users may not claim the same contact. The key is the physical column
  // (contact_id), not the logical field name, because an index is a native
  // read: the adapter's snake_case derive never runs over it.
  {
    collection: 'users',
    keys: { contact_id: 1 },
    options: { unique: true, partialFilterExpression: { contact_id: { $exists: true } } },
  },
  { collection: 'user-sessions', keys: { token: 1 }, options: { unique: true } },
  { collection: 'user-sessions', keys: { user_id: 1 }, options: {} },
  {
    collection: 'user-members',
    keys: { user_id: 1, organization_id: 1 },
    options: { unique: true },
  },
  { collection: 'user-invitations', keys: { organization_id: 1, email: 1 }, options: {} },
  { collection: 'user-organizations', keys: { slug: 1 }, options: { unique: true } },
  // Concurrent-enrolment guard (two-factor design): the unique index turns an
  // unrecoverable silent double-write into a visible duplicate-key error, and
  // it makes ResetUserTwoFactor's single-row delete exact. The reset path is
  // exercised here, so the index belongs in this script.
  { collection: 'user-two-factors', keys: { user_id: 1 }, options: { unique: true } },
  // Platform-owned, unlike the module-owned entries: the engine reads it per
  // request for any unenrolled caller under auth.twoFactor.required, so without
  // it that read is a collection scan.
  { collection: 'user-passkeys', keys: { user_id: 1 }, options: {} },
];

const client = new MongoClient(uri);
try {
  const db = client.db();
  for (const { collection, keys, options } of indexes) {
    const name = await db.collection(collection).createIndex(keys, options);
    console.log(`Created index ${name} on ${collection}.`);
  }
} finally {
  await client.close();
}
