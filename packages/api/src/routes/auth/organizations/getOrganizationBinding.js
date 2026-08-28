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

// The engine retains the deployment's organizations declaration and the
// ensured pinned organization per auth instance. Request and system contexts
// read the retained state synchronously so the _organization operator and
// the org-scoped admin steps can resolve the pinned org at evaluation time.
// The pinned row is retained by ensureOrganization when its ensure resolves
// (at startup, or on the first session fire when startup seeding failed) -
// the org id is minted at creation, so no build artifact can carry it.
const bindingByAuth = new WeakMap();

function registerOrganizationBinding({ auth, database = false, organizations }) {
  bindingByAuth.set(auth, {
    database,
    policy: organizations.policy,
    slug: organizations.org ?? null,
    pinned: null,
  });
}

// The raw registered entry (policy, slug, database, pinned) - used by
// resolvePinnedOrganization to decide whether an ensure is needed.
function getRegisteredOrganization({ auth }) {
  if (type.isNone(auth)) {
    return null;
  }
  return bindingByAuth.get(auth) ?? null;
}

function setPinnedOrganization({ auth, organization, slug }) {
  const binding = bindingByAuth.get(auth);
  if (!binding || binding.policy !== 'pinned' || binding.slug !== slug) {
    return;
  }
  binding.pinned = { id: organization.id, slug: organization.slug, name: organization.name };
}

function getOrganizationBinding({ auth }) {
  if (type.isNone(auth)) {
    return null;
  }
  const binding = bindingByAuth.get(auth);
  if (type.isNone(binding)) {
    return null;
  }
  return { policy: binding.policy, pinned: binding.pinned };
}

export { getRegisteredOrganization, registerOrganizationBinding, setPinnedOrganization };
export default getOrganizationBinding;
