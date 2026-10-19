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

// The token is the credential half of the httpOnly session cookie. BetterAuth's
// default /get-session body ships it to client JS, which Lowdefy is cookie-based
// and never reads - so drop it and keep the rest of the session (id, expiresAt,
// activeOrganizationId, ...) intact. Fed to the customSession plugin, whose
// return value becomes the entire /get-session response.
function sanitizeSessionResponse({ user, session }) {
  const { token, ...safeSession } = session ?? {};
  return { user, session: safeSession };
}

export default sanitizeSessionResponse;
