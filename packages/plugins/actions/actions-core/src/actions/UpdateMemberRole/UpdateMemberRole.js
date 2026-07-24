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

// Updates a member's role in the caller's active organization - authorization
// is BetterAuth's own per-org access control, enforced server-side against the
// caller's member role. Roles resolve from the member row server-side - when
// the caller updates their own role, chain UpdateSession after to re-sync the
// client.
function UpdateMemberRole({ methods: { updateMemberRole }, params }) {
  return updateMemberRole(params);
}

export default UpdateMemberRole;
