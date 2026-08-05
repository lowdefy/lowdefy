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
  Dev seed tool for the reference walkthrough: writes a user's member row in an
  organization and sets user/member attributes. Member and attribute writes are
  the admin steps' job in a real app - auth collections are written only through
  BetterAuth's rails there. This script is walkthrough bootstrap only (the same
  standing as the migration codemod): without it a fresh environment has no
  owner to drive invitations from.

  The member row carries two unrelated authorities in two fields, and this
  script writes each on its own flag:
    --app-roles  member.appRoles, a native array of the app's own role strings.
                 They reach config as _user.roles and are what auth.pages.roles
                 and auth.api.roles gate on. Nothing validates them.
    --org-role   member.role, BetterAuth's owner/admin/member tier. It reaches
                 config as _user.orgRoles, no gate reads it, and it is what
                 every auth step's authority is checked against - per
                 organization, from the caller's row in the target org.

  The member row is the whole grant. Nothing denormalizes either field onto the
  user row, so an out-of-band member write like this one is as complete as an
  in-product one - there is no stale copy left behind and nothing to run
  afterwards to "sync" it.

  Seed the walkthrough admin with --org-role owner, not admin: the plugin's
  creator-protection and last-owner guards only bite while some member actually
  holds owner, so an organization with no owner has every guard inert, and a
  sole admin can demote or remove their way into a deployment nobody can
  administer.

  Note: attributes are declared as type "json" additionalFields; the vendored
  MongoDB adapter stores them as native sub-documents, so this script stores
  them the same way the engine writes them - as objects. Ids are plain strings:
  the engine sets a function-form advanced.database.generateId, for which the
  adapter skips BSON id coercion entirely. The pinned organization's id is its
  slug.

  Usage:
    AUTH_DATABASE_URI='mongodb://...' node scripts/set-member.mjs \
      --email user@example.com --org org-a \
      [--app-roles user-admin,auditor] [--org-role owner] \
      [--member-attributes '{"branches":["a"]}'] \
      [--user-attributes '{"region":"emea"}'] [--remove]
*/

import { MongoClient } from 'mongodb';

const ORG_ROLES = ['owner', 'admin', 'member'];

function getArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

const uri = process.env.AUTH_DATABASE_URI;
const email = getArg('email');
const orgSlug = getArg('org');
const appRoles = getArg('app-roles');
const orgRole = getArg('org-role');
const memberAttributes = getArg('member-attributes');
const userAttributes = getArg('user-attributes');
const remove = process.argv.includes('--remove');

if (!uri || !email || !orgSlug) {
  console.error(
    'Usage: AUTH_DATABASE_URI=... node scripts/set-member.mjs --email <email> --org <slug> [--app-roles r1,r2] [--org-role owner|admin|member] [--member-attributes <json>] [--user-attributes <json>] [--remove]'
  );
  process.exit(1);
}

if (orgRole && !ORG_ROLES.includes(orgRole)) {
  console.error(`--org-role must be one of ${ORG_ROLES.join(', ')}. Received "${orgRole}".`);
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
  const userId = user._id;
  const organizationId = organization._id;

  if (remove) {
    const result = await db.collection('user-members').deleteOne({ userId, organizationId });
    console.log(`Removed ${result.deletedCount} member row for ${email} in ${orgSlug}.`);
  } else {
    const set = { userId, organizationId };
    if (appRoles) set.appRoles = appRoles.split(',').map((role) => role.trim());
    if (orgRole) set.role = orgRole;
    if (memberAttributes) set.attributes = JSON.parse(memberAttributes);
    await db.collection('user-members').updateOne(
      { userId, organizationId },
      {
        $set: set,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    console.log(
      `Set member row for ${email} in ${orgSlug} (appRoles: ${JSON.stringify(
        set.appRoles
      )}, role: ${JSON.stringify(set.role)}).`
    );
  }

  if (userAttributes) {
    await db
      .collection('users')
      .updateOne({ _id: user._id }, { $set: { attributes: JSON.parse(userAttributes) } });
    console.log(`Set user.attributes for ${email}.`);
  }
} finally {
  await client.close();
}
