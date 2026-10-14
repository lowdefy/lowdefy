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

// GenericOAuth covers any OAuth 2.0 / OIDC provider BetterAuth does not ship
// built-in. The Lowdefy provider id becomes the generic OAuth providerId, over
// any providerId in properties: the client signs in, and the build keys
// two-factor and account-linking trust, by the Lowdefy id.
//
// BetterAuth reads emailVerified from the issuer's email_verified claim and
// falls back to false, and the organization plugin refuses invitations to an
// unverified email. trustEmail marks this provider's users verified for an
// issuer that never sends the claim; mapProfileToUser is a function, so YAML
// could not set it.
function GenericOAuth({ id, properties }) {
  const { trustEmail, ...config } = properties;
  if (!type.isNone(trustEmail) && !type.isBoolean(trustEmail)) {
    throw new Error(
      `GenericOAuth property "trustEmail" is not a boolean. Received ${JSON.stringify(trustEmail)}.`
    );
  }
  if (trustEmail) {
    config.mapProfileToUser = () => ({ emailVerified: true });
  }
  return { kind: 'generic', config: { ...config, providerId: id } };
}

export default GenericOAuth;
