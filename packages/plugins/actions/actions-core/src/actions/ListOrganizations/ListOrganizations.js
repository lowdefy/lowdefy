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

// Returns the signed-in user's own organization memberships from BetterAuth
// - keyed on the session alone, not the active organization, so a page can
// list every workspace the caller belongs to. The action takes no params.
function ListOrganizations({ methods: { listOrganizations } }) {
  return listOrganizations();
}

export default ListOrganizations;
