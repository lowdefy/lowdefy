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
  Seeds the journeys' starting point (pnpm test:journeys:auth --app
  auth-reference-b runs it on the fresh database before the dev server starts).
  org-b is invite-only, so a fresh database holds nobody who could sign up or
  send an invitation: this writes the org-b owner and the pending invitation
  that owner sent to invitee@example.test, under the fixed id
  journey-invitation. The owner has no password - only the invitation is used.
  Each row is upserted by its fixed id, so a rerun resets the invitation to
  pending rather than failing on a duplicate key.

  Rows are stored as the engine writes them (see ../../auth-reference/scripts/
  set-member.mjs): snake_case columns, plain string ids, and the pinned
  organization's id is its slug. The organization row itself is left to the
  server, which ensures it at startup.

  Usage: AUTH_DATABASE_URI='mongodb://...' node scripts/seed-journeys.mjs
*/

import { MongoClient } from 'mongodb';

const uri = process.env.AUTH_DATABASE_URI;
if (!uri) {
  console.error('Set AUTH_DATABASE_URI to the auth database connection string.');
  process.exit(1);
}

const now = new Date();
const client = new MongoClient(uri);
try {
  const db = client.db();
  await db.collection('users').replaceOne(
    { _id: 'journey-owner' },
    {
      email: 'owner@example.test',
      name: 'Journey Owner',
      email_verified: true,
      created_at: now,
      updated_at: now,
    },
    { upsert: true }
  );
  await db.collection('user-members').replaceOne(
    { _id: 'journey-owner-member' },
    {
      user_id: 'journey-owner',
      organization_id: 'org-b',
      role: 'owner',
      created_at: now,
    },
    { upsert: true }
  );
  await db.collection('user-invitations').replaceOne(
    { _id: 'journey-invitation' },
    {
      email: 'invitee@example.test',
      role: 'member',
      organization_id: 'org-b',
      status: 'pending',
      inviter_id: 'journey-owner',
      expires_at: new Date(now.getTime() + 60 * 60 * 1000),
      created_at: now,
    },
    { upsert: true }
  );
  console.log('Seeded the org-b owner and a pending invitation for invitee@example.test.');
} finally {
  await client.close();
}
