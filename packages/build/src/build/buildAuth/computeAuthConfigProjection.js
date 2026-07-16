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

import normalizeRoleCatalog from './normalizeRoleCatalog.js';

// The curated projection the _build.authConfig operator reads. Computed from
// the resolved auth: block with the same effective defaults setAuthDefaults
// applies: presence of twoFactor/passkey implies enabled, and organizations
// signup defaults to the safe invite-only policy under pinned (the default
// policy) while tenant is inherently open. Providers are projected to
// { id, type } only — never properties or secrets.
function computeAuthConfigProjection(auth = {}) {
  const source = type.isObject(auth) ? auth : {};
  const organizations = type.isObject(source.organizations) ? source.organizations : {};
  const policy = organizations.policy ?? 'pinned';
  const signupDefault = policy === 'tenant' ? 'open' : 'invite-only';
  return {
    emailAndPassword: { enabled: source.emailAndPassword?.enabled === true },
    magicLink: { enabled: source.magicLink?.enabled === true },
    twoFactor: { enabled: !type.isNone(source.twoFactor) && source.twoFactor.enabled !== false },
    passkey: { enabled: !type.isNone(source.passkey) && source.passkey.enabled !== false },
    phoneNumber: {
      enabled: source.phoneNumber?.enabled === true,
      // Boolean, not the block - gates whether phone sign-up UI renders;
      // tempEmailDomain is server wiring the client has no use for.
      signUpOnVerification: !type.isNone(source.phoneNumber?.signUpOnVerification),
    },
    // siteKey is public by definition - every browser reads it from the page
    // - so projecting it respects the secret-free contract; secretKey stays
    // out mechanically (the catalog is allowlist-only).
    captcha: {
      enabled: source.captcha?.enabled === true,
      provider: source.captcha?.provider ?? null,
      siteKey: source.captcha?.siteKey ?? null,
    },
    providers: (type.isArray(source.providers) ? source.providers : []).map((provider) => ({
      id: provider?.id ?? null,
      type: provider?.type ?? null,
    })),
    organizations: { signup: organizations.signup ?? signupDefault },
    // Normalized through the same helper buildRoleCatalog uses so the two
    // decoupled clones of the auth subtree agree on the label ?? id default.
    roles: normalizeRoleCatalog(source.roles),
  };
}

export default computeAuthConfigProjection;
