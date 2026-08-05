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
  One-off operator reshape of a pre-release experiment auth database into the
  storage shape the engine reads today: app roles on member.appRoles as a
  native array, member.role restricted to BetterAuth's owner/admin/member
  org-authority tier, no user.role denormalization, and - under the pinned
  policy - the organization keyed by its configured slug.

  This is not an app-facing migration and there is no migration tier for it.
  Nothing has shipped on the old shape, where one comma-separated member.role
  string carried both authorities at once; the only databases that hold it are
  experiment databases whose operator runs this script by hand, once.

  Usage (run the dry run first - it prints every count and a sample of each
  rewrite and writes nothing):
    AUTH_DATABASE_URI='mongodb://...' node scripts/reshape-org-authority.mjs \
      --policy pinned --org org-a --user-admin-role user-admin --dry-run
    AUTH_DATABASE_URI='mongodb://...' node scripts/reshape-org-authority.mjs \
      --policy pinned --org org-a --user-admin-role user-admin

    AUTH_DATABASE_URI='mongodb://...' node scripts/reshape-org-authority.mjs \
      --policy tenant --dry-run
    AUTH_DATABASE_URI='mongodb://...' node scripts/reshape-org-authority.mjs \
      --policy tenant

  --policy has no default, because the two rules are not interchangeable and
  the wrong one is silently destructive. It names the policy the database was
  WRITTEN under, not the one the app runs under now.

  Under pinned the whole CSV becomes appRoles and role becomes 'member',
  keeping a stored 'admin' as the app role it was: under that policy the
  organization plugin registered the authored catalog with empty statement
  sets and reserved none of the three built-in names, so 'admin' in a pinned
  member.role granted nothing. Running the tenant rule over it instead routes
  that name to the org tier, where it resolves against the real adminAc - so
  every holder of an app role that happens to be called admin gains authority
  to invite, remove and re-role members - and strips the name out of appRoles,
  so every page and endpoint gate that names it stops matching with no error
  anywhere. Two silent harms, opposite directions, from one missing flag.

  Under tenant the built-in names go to role and the rest to appRoles. The old
  model's ambiguity is real there but already resolved: the plugin registered
  the catalog as { ...catalogRoles, ...defaultRoles }, so a built-in name
  shadowed any authored role of the same name and the org tier is what the
  stored value resolved as.

  Under tenant there is no organization to scope by, so every member and
  invitation row in the database is reshaped. The reference apps share one auth
  database between pinned and tenant apps; reshape such a database with
  --policy pinned --org <slug> for each pinned organization FIRST, then run the
  tenant pass - rows that already carry an appRoles array are skipped, so the
  pinned rows keep the pinned rule.

  Whoever held the legacy auth.userAdminRole value is granted 'owner' on role
  in the pinned organization, not 'admin'. BetterAuth's guards against
  un-administering an organization all key on creatorRole, which is 'owner':
  removeMember refuses only when the target holds it
  (plugins/organization/routes/crud-members.mjs:175-181) and updateMemberRole
  counts remaining owners only when the updater is an owner editing themselves
  (:296-305). An organization whose most senior member is an admin therefore
  has every one of those guards inert, and a sole admin can demote or remove
  their way into a deployment nobody can administer - which under
  signup: invite-only nobody can sign up to repair either. 'owner' also
  preserves exactly the authority those users hold today.

  user.role is cleared where it holds the legacy value and nothing is written
  in its place. Nothing writes that field any more - there is no recompute and
  no reserved name to put there. A foreign value is left alone.

  user-sessions is deleted outright rather than rewritten, and everyone must
  sign in again once. session.activeOrganizationId is a stored field, not a
  derived one (plugins/organization/organization.mjs:394-398), so every
  existing session row holds the pre-re-key organization id, which the pinned
  active-organization invariant refuses - the session resolves unauthenticated.
  A whole-collection delete has one outcome; a field rewrite that half
  completes leaves sessions that fail that way with no sign that the reshape
  is the cause. In a pre-release experiment database a stale session is worth
  nothing and the ambiguity is worth less.

  Field names here are the live camelCase ones - appRoles, organizationId. If
  the snake-case data-fields work has landed in the database being reshaped
  they are app_roles and organization_id instead; there is no ordering
  dependency between the two, but the operator has to know which shape their
  database is in and edit these names to match.

  Collection names are the fixed BetterAuth-model-to-collection mapping in
  packages/api/src/routes/auth/modelNames.js.
*/

import { MongoClient } from 'mongodb';

// The org-authority tier. Registered under both policies and the only values
// member.role may hold after this script has run.
const BUILT_IN_ROLES = ['owner', 'admin', 'member'];

// A slug the app never reads. The unique slug index means the re-keyed
// organization row cannot carry the real slug while the old row still does.
const REKEY_SLUG_SUFFIX = '--rekey-in-progress';

const SAMPLE_LIMIT = 5;

function getArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

const uri = process.env.AUTH_DATABASE_URI;
const policy = getArg('policy');
const orgSlug = getArg('org');
const userAdminRole = getArg('user-admin-role');
const dryRun = process.argv.includes('--dry-run');

if (!uri) {
  console.error('Set AUTH_DATABASE_URI to the auth database connection string.');
  process.exit(1);
}
if (policy !== 'pinned' && policy !== 'tenant') {
  console.error(
    'Pass --policy pinned or --policy tenant - the policy the database was written under. There is no ' +
      'default: under pinned the whole member.role CSV moves to appRoles and role becomes "member", while ' +
      'under tenant the built-in names owner/admin/member stay on role and only the rest move to appRoles. ' +
      'Guessing wrong under pinned hands real org authority to every holder of an app role named "admin" ' +
      'and removes that name from appRoles, so the gates naming it stop matching silently.'
  );
  process.exit(1);
}
if (policy === 'pinned' && !orgSlug) {
  console.error('Pass --org <configured organizations.org slug> under the pinned policy.');
  process.exit(1);
}
if (policy === 'tenant' && userAdminRole) {
  console.error(
    'The --user-admin-role grant is pinned-only: it grants owner in one named organization, and a tenant ' +
      'database has no such organization. Drop the flag to reshape roles only.'
  );
  process.exit(1);
}

// The pinned rule keeps a built-in name in appRoles because under that policy
// it was never the org tier. The 'member' and '' entries are dropped instead:
// both are the old model's no-grants placeholder, in its two spellings, and
// neither is an app role anything can gate on.
function splitRole({ role }) {
  const entries = String(role ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (policy === 'pinned') {
    return { appRoles: entries.filter((entry) => entry !== 'member'), entries, role: 'member' };
  }
  const builtIn = entries.filter((entry) => BUILT_IN_ROLES.includes(entry));
  return {
    appRoles: entries.filter((entry) => !builtIn.includes(entry)),
    entries,
    // BetterAuth reads role as a comma-separated list of tier names itself, so
    // a row that held more than one keeps them all: that is what it resolved
    // as. An entry-less split means no tier, which is 'member'.
    role: builtIn.length > 0 ? builtIn.join(',') : 'member',
  };
}

function reportPass({ label, summary }) {
  const changed = dryRun ? `${summary.changed} to change` : `${summary.changed} changed`;
  console.log(
    `${label}: ${summary.scanned} scanned, ${changed}, ${summary.skipped} already reshaped.`
  );
  for (const sample of summary.samples) {
    console.log(`  ${sample}`);
  }
}

async function reshapeRoles({ collection, db, filter, noteRow }) {
  const rows = await db.collection(collection).find(filter).toArray();
  const summary = { changed: 0, samples: [], scanned: rows.length, skipped: 0 };
  for (const row of rows) {
    // An appRoles array is the mark of a reshaped row: its role field no
    // longer holds the CSV, so splitting it a second time would route the org
    // tier this script just wrote into appRoles and blank the tier.
    const reshaped = Array.isArray(row.appRoles);
    const next = reshaped ? undefined : splitRole({ role: row.role });
    // heldRoles is the row's app-role names and role the tier it ends the pass
    // with, whether this run wrote them or an earlier run did.
    noteRow?.({
      heldRoles: next?.entries ?? row.appRoles,
      role: next?.role ?? row.role,
      row,
    });
    if (reshaped) {
      summary.skipped += 1;
      continue;
    }
    if (dryRun && summary.samples.length < SAMPLE_LIMIT) {
      summary.samples.push(
        `${row._id}: role ${JSON.stringify(row.role ?? null)} -> role ` +
          `${JSON.stringify(next.role)}, appRoles ${JSON.stringify(next.appRoles)}`
      );
    }
    if (!dryRun) {
      await db
        .collection(collection)
        .updateOne({ _id: row._id }, { $set: { appRoles: next.appRoles, role: next.role } });
    }
    summary.changed += 1;
  }
  return summary;
}

const client = new MongoClient(uri);
try {
  const db = client.db();
  console.log(
    `Reshaping with the "${policy}" rule${dryRun ? ' (dry run - nothing is written).' : '.'}`
  );

  // Pass 1: locate the pinned organization. Its stored _id is the id every
  // member and invitation row references, whatever its type - reading it here
  // rather than assuming a format is what makes the reference rewrite match.
  let oldOrgId;
  let rowFilter = {};
  if (policy === 'pinned') {
    const organization = await db.collection('user-organizations').findOne({ slug: orgSlug });
    if (!organization) {
      console.error(
        `No organization found with slug ${orgSlug}. Check --org against the app's ` +
          'organizations.org value and the database in AUTH_DATABASE_URI.'
      );
      process.exit(1);
    }
    oldOrgId = organization._id;
    // Sibling pinned apps share an auth database in the reference set, so
    // every pass below is scoped to this organization's rows.
    rowFilter = { organizationId: oldOrgId };
    console.log(`Organization "${orgSlug}" is keyed by id ${JSON.stringify(oldOrgId)}.`);
  }

  const grantOwner = policy === 'pinned' && Boolean(userAdminRole);
  const userAdminHolders = [];

  // Pass 2: the member role split. Whoever held the legacy user-admin value
  // is collected here, while the CSV is still readable - pass 4 needs them.
  const members = await reshapeRoles({
    collection: 'user-members',
    db,
    filter: rowFilter,
    noteRow: ({ heldRoles, role, row }) => {
      // A holder is recognised from the pre-split CSV on a row this run
      // reshapes and from appRoles on a row an earlier run reshaped. Both
      // matter: a run that stopped between this pass and pass 4 must still
      // grant owner on the retry, or the organization is left without one.
      if (grantOwner && heldRoles.includes(userAdminRole)) {
        userAdminHolders.push({ _id: row._id, role });
      }
    },
  });
  reportPass({ label: 'user-members role split', summary: members });

  // Pass 3: the same split over invitations, pending or not. Accepting an
  // invitation mints the member row from invitation.role verbatim, so a CSV
  // left here would put an app role in the org tier after the reshape.
  const invitations = await reshapeRoles({
    collection: 'user-invitations',
    db,
    filter: rowFilter,
  });
  reportPass({ label: 'user-invitations role split', summary: invitations });

  // Pass 4: the owner grant and the user.role clear.
  if (grantOwner) {
    let granted = 0;
    if (!dryRun) {
      for (const holder of userAdminHolders) {
        const result = await db
          .collection('user-members')
          .updateOne({ _id: holder._id }, { $set: { role: 'owner' } });
        granted += result.modifiedCount;
      }
    }
    const grantSummary = dryRun
      ? `${userAdminHolders.length} to change`
      : `${granted} changed, ${userAdminHolders.length - granted} already owner`;
    console.log(
      `owner grant for "${userAdminRole}" holders: ${userAdminHolders.length} scanned, ${grantSummary}.`
    );
    if (dryRun) {
      for (const holder of userAdminHolders.slice(0, SAMPLE_LIMIT)) {
        console.log(`  ${holder._id}: role ${JSON.stringify(holder.role)} -> "owner"`);
      }
    }

    // A user.role holding anything else is not this script's to touch: the
    // field is no authority input any more, and a foreign value is the app's.
    const staleUsers = await db.collection('users').find({ role: userAdminRole }).toArray();
    if (!dryRun) {
      await db.collection('users').updateMany({ role: userAdminRole }, { $unset: { role: '' } });
    }
    console.log(
      `users.role clear: ${staleUsers.length} rows hold "${userAdminRole}", ` +
        `${dryRun ? 'to unset' : 'unset'}.`
    );
    if (dryRun) {
      for (const user of staleUsers.slice(0, SAMPLE_LIMIT)) {
        console.log(`  ${user._id}: role ${JSON.stringify(user.role)} -> unset`);
      }
    }
  }

  const rekey = policy === 'pinned' && oldOrgId !== orgSlug;
  if (policy === 'pinned' && !rekey) {
    console.log(
      `Organization "${orgSlug}" is already keyed by its slug - the re-key, the reference rewrite ` +
        'and the session delete are no-ops.'
    );
  }

  if (rekey) {
    // Pass 5: re-key the organization document. MongoDB's _id is immutable, so
    // this is an insert plus a delete rather than an update. The insert goes
    // first: a crash between the two then leaves two organization rows, which
    // an operator can reconcile, where the other order can leave none. The
    // unique slug index refuses a second row carrying the same slug, so the
    // new row is inserted under a slug the app never reads and takes the real
    // one only once the old row is gone.
    const organization = await db.collection('user-organizations').findOne({ _id: oldOrgId });
    const rekeySlug = `${orgSlug}${REKEY_SLUG_SUFFIX}`;
    if (dryRun) {
      console.log(
        `organization re-key: insert ${JSON.stringify(orgSlug)}, delete ` +
          `${JSON.stringify(oldOrgId)} (slug ${JSON.stringify(orgSlug)} unchanged).`
      );
    } else {
      // An earlier run that stopped mid-re-key left the new row behind; take
      // it as it stands rather than failing on its duplicate _id.
      const existing = await db.collection('user-organizations').findOne({ _id: orgSlug });
      if (!existing) {
        await db
          .collection('user-organizations')
          .insertOne({ ...organization, _id: orgSlug, slug: rekeySlug });
      }
      await db.collection('user-organizations').deleteOne({ _id: oldOrgId });
      await db
        .collection('user-organizations')
        .updateOne({ _id: orgSlug }, { $set: { slug: orgSlug } });
      console.log(
        `organization re-key: ${JSON.stringify(oldOrgId)} -> ${JSON.stringify(orgSlug)}.`
      );
    }

    // Pass 6: the references. user-members and user-invitations are the only
    // collections holding an organizationId; the third, user-sessions, holds
    // the id as activeOrganizationId and pass 7 drops it wholesale.
    for (const collection of ['user-members', 'user-invitations']) {
      const filter = { organizationId: oldOrgId };
      if (dryRun) {
        const count = await db.collection(collection).countDocuments(filter);
        console.log(`${collection}.organizationId rewrite: ${count} to change.`);
        continue;
      }
      const result = await db
        .collection(collection)
        .updateMany(filter, { $set: { organizationId: orgSlug } });
      console.log(`${collection}.organizationId rewrite: ${result.modifiedCount} changed.`);
    }

    // Pass 7: the sessions.
    const sessions = await db.collection('user-sessions').countDocuments({});
    if (!dryRun) {
      await db.collection('user-sessions').deleteMany({});
    }
    console.log(
      `user-sessions: ${sessions} ${dryRun ? 'to delete' : 'deleted'}. Every signed-in user must ` +
        'sign in again - their session held the old organization id, and a session carrying it ' +
        'resolves unauthenticated. This is the first thing anyone notices after the reshape and ' +
        'it is not the pinned active-organization invariant misbehaving.'
    );
  }
} finally {
  await client.close();
}
