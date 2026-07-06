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
  { collection: 'user-sessions', keys: { token: 1 }, options: { unique: true } },
  { collection: 'user-sessions', keys: { userId: 1 }, options: {} },
  {
    collection: 'user-members',
    keys: { userId: 1, organizationId: 1 },
    options: { unique: true },
  },
  { collection: 'user-invitations', keys: { organizationId: 1, email: 1 }, options: {} },
  { collection: 'user-organizations', keys: { slug: 1 }, options: { unique: true } },
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
