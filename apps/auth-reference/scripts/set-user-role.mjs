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
  Dev seed tool for the impersonation walkthrough: sets the BetterAuth admin
  plugin's user.role field. This is NOT the Lowdefy member role that gates
  pages and endpoints (set-member.mjs does that) - it is the field
  BetterAuth's own admin access control checks when a client calls
  impersonateUser/stopImpersonating. The admin steps do not need it (they
  execute with server authority behind the endpoint role gate); only the
  impersonation client actions do.

  Usage:
    AUTH_DATABASE_URI='mongodb://...' node scripts/set-user-role.mjs \
      --email user@example.com --role admin
    Use --remove to clear the field again.
*/

import { MongoClient } from 'mongodb';

function getArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

const uri = process.env.AUTH_DATABASE_URI;
const email = getArg('email');
const role = getArg('role');
const remove = process.argv.includes('--remove');

if (!uri || !email || (!role && !remove)) {
  console.error(
    'Usage: AUTH_DATABASE_URI=... node scripts/set-user-role.mjs --email <email> --role <role> [--remove]'
  );
  process.exit(1);
}

const client = new MongoClient(uri);
try {
  const db = client.db();
  const user = await db.collection('users').findOne({ email });
  if (!user) {
    console.error(`No user found with email ${email}.`);
    process.exit(1);
  }

  if (remove) {
    await db.collection('users').updateOne({ _id: user._id }, { $unset: { role: '' } });
    console.log(`Removed user.role for ${email}.`);
  } else {
    await db.collection('users').updateOne({ _id: user._id }, { $set: { role } });
    console.log(`Set user.role to "${role}" for ${email}.`);
  }
} finally {
  await client.close();
}
