/*
  Copyright 2020-2022 Lowdefy, Inc

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

function OpenIDConnectProvider(options) {
  return {
    id: options.id ?? 'OpenIDConnectProvider',
    name: options.name ?? 'OpenIDConnectProvider',
    wellKnown: `${options.issuer}/.well-known/openid-configuration`,
    type: 'oauth',
    authorization: options.authorization ?? { params: { scope: 'openid email profile' } },
    checks: options.checks ?? ['pkce', 'state'],
    idToken: options.idToken ?? true,
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.nickname,
        email: profile.email,
        image: profile.picture,
      };
    },
    options: options,
  };
}

export default OpenIDConnectProvider;
