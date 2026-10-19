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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

// The Lowdefy surface lists provider ids (or the literal "emailAndPassword");
// BetterAuth expects its own provider keys. The build translates so the
// runtime passes the list through unchanged:
// - "emailAndPassword" -> "email-password" (BetterAuth's credential method key)
// - GenericOAuth entries -> the entry id (the generic OAuth providerId)
// - built-in providers -> the lowercase BetterAuth provider key
function buildTrustedProviders({ components }) {
  const accountLinking = components.auth.account?.accountLinking;
  if (type.isNone(accountLinking) || !type.isArray(accountLinking.trustedProviders)) {
    return components;
  }
  const providersById = new Map(
    components.auth.providers.map((provider) => [provider.id, provider])
  );
  accountLinking.trustedProviders = accountLinking.trustedProviders.map((id) => {
    if (id === 'emailAndPassword') {
      return 'email-password';
    }
    const provider = providersById.get(id);
    if (type.isNone(provider)) {
      throw new ConfigError(
        `Auth "account.accountLinking.trustedProviders" references unknown provider id "${id}". List the "id" of a provider configured in "auth.providers", or the literal "emailAndPassword".`,
        { configKey: accountLinking['~k'] ?? components.auth['~k'] }
      );
    }
    if (provider.type === 'GenericOAuth') {
      return provider.id;
    }
    return provider.type.toLowerCase();
  });
  return components;
}

export default buildTrustedProviders;
