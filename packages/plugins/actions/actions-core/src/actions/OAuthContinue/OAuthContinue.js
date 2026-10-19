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

// Resumes the pending OAuth authorization after the post-login choice - the
// organization the grant acts in. The page runs SetActiveOrganization for the
// chosen organization first, then this: the authorization server reads the
// choice from the session's active organization and proceeds to consent (or
// straight to the client when consent for that organization already stands).
// The signed authorization query the page arrived with is not passed as
// params - the auth client lifts it from the page URL, so the action must run
// before any navigation drops that query. Returns the next URL for page
// config to navigate to.
function OAuthContinue({ methods: { oauth2Continue }, params }) {
  return oauth2Continue(params);
}

export default OAuthContinue;
