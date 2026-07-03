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

// Ensure-by-slug seeding for the pinned organization: no org with the
// configured slug means create it, otherwise do nothing. Idempotent and
// self-bootstrapping - a fresh environment needs no manual seed step.
// The organization row is written through the adapter, not the plugin's
// createOrganization endpoint: at better-auth@1.6.23 that endpoint requires
// a creator user (it mints an owner member row), and a seeded org has no
// creator - membership is granted by invite. Racing instances are
// backstopped by the unique slug index.
const ensuredByAuth = new WeakMap();

async function findOrganizationBySlug({ adapter, slug }) {
  return adapter.findOne({
    model: 'organization',
    where: [{ field: 'slug', value: slug }],
  });
}

async function ensure({ auth, slug }) {
  const { adapter } = await auth.$context;
  const existing = await findOrganizationBySlug({ adapter, slug });
  if (existing) {
    return existing;
  }
  try {
    return await adapter.create({
      model: 'organization',
      data: {
        name: slug,
        slug,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    // A racing instance created the org between the find and the create -
    // the unique slug index rejected this write, so read the winner's row.
    const created = await findOrganizationBySlug({ adapter, slug });
    if (created) {
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
