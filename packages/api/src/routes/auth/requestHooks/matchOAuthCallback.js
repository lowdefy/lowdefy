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

// The two OAuth callback paths a Lowdefy deployment can reach, and the path
// parameter each identifies the provider by:
// - /callback/:id                built-in social providers, keyed on the
//                                lowercase BetterAuth provider key
// - /oauth2/callback/:providerId  the genericOAuth plugin, keyed on the Lowdefy
//                                provider id
// buildTwoFactorTrustedProviders normalises auth.providers into exactly these
// two key shapes, so the segment compares directly against its output.
//
// Both patterns are anchored and take a single segment: an unanchored
// startsWith check would claim /callback/google/extra, a path BetterAuth serves
// no route for, and a greedy segment would read /oauth2/callback/my-idp as a
// social callback for a provider named "oauth2".
function matchOAuthCallback(path) {
  const generic = /^\/oauth2\/callback\/([^/]+)$/.exec(path);
  if (generic) {
    return { matched: true, providerKey: generic[1] };
  }
  const social = /^\/callback\/([^/]+)$/.exec(path);
  if (social) {
    return { matched: true, providerKey: social[1] };
  }
  return { matched: false };
}

export default matchOAuthCallback;
