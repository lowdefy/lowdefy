/* eslint-disable no-param-reassign */

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

// Translates the per-provider auth.providers[].twoFactorTrusted flags into the
// keys the OAuth callbacks identify a provider by, so the engine's challenge
// hook can match on the callback path parameter directly. The same translation
// buildTrustedProviders.js performs, and for the same reason: a deployment names
// providers one way throughout (the Lowdefy provider id), and the build maps to
// BetterAuth's vocabulary.
// - GenericOAuth entries -> the entry id      (/oauth2/callback/:providerId)
// - built-in providers   -> the lowercase type (/callback/:id)
//
// This list and account.accountLinking.trustedProviders are unrelated - one
// declares MFA trust, the other email-claim trust - so they are built
// independently here rather than sharing a step with buildTrustedProviders.js.
//
// twoFactor.mfaTrustedProviderKeys has no schema entry: validateAuthConfig runs
// before this step (and testSchema runs before buildAuth entirely), so nothing
// validates auth.twoFactor afterwards - a build-derived key written here needs
// no schema slot, and omitting one is what keeps an app from setting it directly.
function buildTwoFactorTrustedProviders({ components }) {
  if (components.auth.twoFactor?.enabled !== true) {
    return components;
  }
  const trusted = (components.auth.providers ?? [])
    .filter((provider) => provider.twoFactorTrusted === true)
    .map((provider) =>
      provider.type === 'GenericOAuth' ? provider.id : provider.type.toLowerCase()
    );
  components.auth.twoFactor.mfaTrustedProviderKeys = trusted;
  return components;
}

export default buildTwoFactorTrustedProviders;
