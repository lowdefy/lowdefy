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
  Dev seed tool for the reference walkthrough: promotes a user's member row
  in an organization (roles as a CSV string) and sets user/member attributes.
  Attribute and role writes are the phase-6 admin steps' job in a real app -
  auth collections are written only through BetterAuth's rails there. This
  script is walkthrough bootstrap only (the same standing as the migration
  codemod): without it a fresh environment has no owner/admin to drive
  invitations from.

  Note: attributes are declared as type "json" additionalFields; the
  vendored MongoDB adapter stores them as native sub-documents, so this
  script stores them the same way the engine writes them - as objects.

  Usage:
    AUTH_DATABASE_URI='mongodb://...' node scripts/set-member.mjs \
      --email user@example.com --org org-a [--roles admin,auditor] \
      [--member-attributes '{"branches":["a"]}'] \
      [--user-attributes '{"region":"emea"}'] [--remove]
*/

import { MongoClient } from 'mongodb';

function getArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

const uri = process.env.AUTH_DATABASE_URI;
const email = getArg('email');
const orgSlug = getArg('org');
const roles = getArg('roles');
const memberAttributes = getArg('member-attributes');
const userAttributes = getArg('user-attributes');
const remove = process.argv.includes('--remove');

if (!uri || !email || !orgSlug) {
  console.error(
    'Usage: AUTH_DATABASE_URI=... node scripts/set-member.mjs --email <email> --org <slug> [--roles r1,r2] [--member-attributes <json>] [--user-attributes <json>] [--remove]'
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
  const organization = await db.collection('user-organizations').findOne({ slug: orgSlug });
  if (!organization) {
    console.error(`No organization found with slug ${orgSlug}.`);
    process.exit(1);
  }
  // The adapter stores id references (member.userId / organizationId) as
  // ObjectIds - a string here would never match the engine's member read.
  const userId = user._id;
  const organizationId = organization._id;

  if (remove) {
    const result = await db.collection('user-members').deleteOne({ userId, organizationId });
    console.log(`Removed ${result.deletedCount} member row for ${email} in ${orgSlug}.`);
  } else {
    const set = { userId, organizationId };
    if (roles) set.role = roles;
    if (memberAttributes) set.attributes = JSON.parse(memberAttributes);
    await db.collection('user-members').updateOne(
      { userId, organizationId },
      {
        $set: set,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    console.log(`Set member row for ${email} in ${orgSlug}${roles ? ` (role: ${roles})` : ''}.`);
  }

  if (userAttributes) {
    await db
      .collection('users')
      .updateOne(
        { _id: user._id },
        { $set: { attributes: JSON.parse(userAttributes) } }
      );
    console.log(`Set user.attributes for ${email}.`);
  }
} finally {
  await client.close();
}
