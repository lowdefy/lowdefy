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

// The resolved caller for the client - the same resolveAuthentication output
// the first page load embeds. The base session carries neither roles (read
// live from the active member row) nor the merged attributes bag, so the
// client re-syncs from here (UpdateSession) after a session change such as
// SetActiveOrganization.
async function userHandler(c) {
  const context = c.get('lowdefyContext');
  return c.json({ user: context.user ?? null });
}

export default userHandler;
