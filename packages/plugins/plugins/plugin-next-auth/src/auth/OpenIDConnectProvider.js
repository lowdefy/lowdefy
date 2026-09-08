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

function OpenIDConnectProvider(properties) {
  // Auth.js v5 models OpenID Connect as an explicit 'oidc' provider type —
  // discovery via issuer/wellKnown and ID token handling are built in,
  // so the v4 `idToken: true` flag is no longer needed.
  return {
    id: properties.id ?? 'OpenIDConnectProvider',
    name: properties.name ?? 'OpenIDConnectProvider',
    type: 'oidc',
    authorization: { params: { scope: 'openid email profile' } },
    checks: ['pkce', 'state'],
    ...properties,
  };
}

export default OpenIDConnectProvider;
