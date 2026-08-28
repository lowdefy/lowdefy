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

// Approves or denies the pending OAuth authorization request. The signed
// authorization query the consent page arrived with is not passed as params
// - the auth client lifts it from the page URL, so the action must run
// before any navigation drops that query. Returns the OAuth client's
// redirect URI (carrying a code on accept, error=access_denied on deny) for
// page config to navigate to.
function OAuthConsent({ methods: { oauth2Consent }, params }) {
  return oauth2Consent(params);
}

export default OAuthConsent;
