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

// The engine-tier binding on the organization plugin's afterCreateOrganization
// hook. The createOrganization endpoint mints its creator as an owner member
// with no app roles, so the hook writes auth.organizations.creatorAppRoles
// onto that member row, the same roles the tenant signup mint writes
// (createActiveOrgPolicyHook). The endpoint's beforeAddMember hook is no place
// for it: it also fires for addMember, where the new member is not the
// creator.
//
// The endpoint returns the member object it passes here, so the roles are set
// on it as well, and the CreateOrganization step's result shows the row as
// written. A creator-less organization (CreateOrganization's provisioning
// path) has no member to grant roles to, and an empty list leaves the member
// row as the endpoint wrote it.
function createAfterCreateOrganizationHook({ creatorAppRoles, getAuth }) {
  return async function afterCreateOrganizationHook({ member }) {
    if (type.isNone(member) || creatorAppRoles.length === 0) {
      return;
    }
    const { adapter } = await getAuth().$context;
    await adapter.update({
      model: 'member',
      where: [{ field: 'id', value: member.id }],
      update: { appRoles: creatorAppRoles },
    });
    member.appRoles = creatorAppRoles;
  };
}

export default createAfterCreateOrganizationHook;
