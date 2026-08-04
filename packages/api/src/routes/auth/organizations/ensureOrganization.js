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

import { setPinnedOrganization } from './getOrganizationBinding.js';
import OrganizationKeyError from './OrganizationKeyError.js';

// Ensure-by-slug seeding for the pinned organization: no org with the
// configured slug means create it, otherwise do nothing. Idempotent and
// self-bootstrapping - a fresh environment needs no manual seed step.
// The organization row is written through the adapter, not the plugin's
// createOrganization endpoint: at better-auth@1.6.23 that endpoint requires
// a creator user (it mints an owner member row), and a seeded org has no
// creator - membership is granted by invite. Racing instances are
// backstopped by the unique slug index.
//
// Organization id format is policy-dependent: under pinned the id is the
// configured slug, so the one configured value keys every read. Tenant
// organizations are minted lazily per user with generated slugs and keep
// generated ids.
const ensuredByAuth = new WeakMap();

async function findOrganizationBySlug({ adapter, slug }) {
  return adapter.findOne({
    model: 'organization',
    where: [{ field: 'slug', value: slug }],
  });
}

// The ensure is find-or-create by slug and only the create path sets an id, so
// a row that predates slug ids comes back keyed by a generated uuid and cannot
// be repaired from here - MongoDB _id is immutable. Left to run,
// applyPinnedPolicy writes that stale id to session.activeOrganizationId at
// every session.create and the pinned active-organization invariant refuses the
// session it just described, so every caller in the deployment resolves
// unauthenticated forever with the app's own sign-in page as the only symptom.
// Failing here trades that for a message that names the re-key.
function assertKeyedBySlug({ organization, slug }) {
  if (organization.id !== slug) {
    throw new OrganizationKeyError(
      `The organization with slug "${slug}" is keyed by id "${organization.id}", not by its slug. ` +
        'Under the "pinned" organizations policy the organization id must equal its slug. Re-key the ' +
        'organization row and every member.organizationId / invitation.organizationId that references it, ' +
        'and delete the user-sessions collection (session.activeOrganizationId is a stored field holding ' +
        'the old id).'
    );
  }
}

async function ensure({ auth, slug }) {
  const { adapter } = await auth.$context;
  const existing = await findOrganizationBySlug({ adapter, slug });
  if (existing) {
    assertKeyedBySlug({ organization: existing, slug });
    return existing;
  }
  try {
    return await adapter.create({
      model: 'organization',
      data: {
        // The pinned organization's id is its slug, so every consumer that
        // knows the configured slug knows the id: the module's read $match,
        // each step's organizationId and the bootstrap invitation document all
        // key off it with no slug-to-id lookup at request time.
        id: slug,
        name: slug,
        slug,
        createdAt: new Date(),
      },
      // Without this the adapter factory drops the id with a warning and the
      // configured generateId mints a uuid in its place. The id survives as a
      // slug because that generateId is function-form: the factory only holds
      // an explicit id to the uuid format when generateId is the string 'uuid'.
      forceAllowId: true,
    });
  } catch (error) {
    // A racing instance created the org between the find and the create -
    // the unique slug index rejected this write, so read the winner's row.
    const created = await findOrganizationBySlug({ adapter, slug });
    if (created) {
      assertKeyedBySlug({ organization: created, slug });
      return created;
    }
    throw error;
  }
}

function ensureOrganization({ auth, slug }) {
  let bySlug = ensuredByAuth.get(auth);
  if (!bySlug) {
    bySlug = new Map();
    ensuredByAuth.set(auth, bySlug);
  }
  if (!bySlug.has(slug)) {
    const promise = ensure({ auth, slug })
      .then((organization) => {
        // Retain the ensured row for synchronous request-time reads - the
        // _organization operator and step organizationId defaulting.
        setPinnedOrganization({ auth, organization, slug });
        return organization;
      })
      .catch((error) => {
        // Do not memoize a failure - the next fire retries the ensure.
        bySlug.delete(slug);
        throw error;
      });
    bySlug.set(slug, promise);
  }
  return bySlug.get(slug);
}

export default ensureOrganization;
