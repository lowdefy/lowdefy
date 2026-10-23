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
import { getOrgAdapter } from 'better-auth/plugins';

// The rows are written straight through the org plugin's own adapter layer, not
// its createOrganization endpoint. The endpoint mints its creator as an owner
// member with no app roles, so granting auth.organizations.creatorAppRoles
// would take a second write, and undoing both rows when that one failed.
// Written here, the owner row carries its app roles from the one write, the
// same way the tenant signup mint writes it (createActiveOrgPolicyHook).
//
// Of what the endpoint checks for a system action, this keeps the two that
// apply: the creator must be a user, and the slug must be free. The engine sets
// no organizationLimit, teams or member hooks. A provisioned organization has
// no creator - membership arrives by invitation - so it gets no member row.
async function CreateOrganization({ acting, auth, organization: organizations, properties }) {
  const { userId: propertiesUserId, ...organizationFields } = properties;
  const userId = propertiesUserId ?? acting.user?.id;
  if (type.isNone(organizationFields.name) || type.isNone(organizationFields.slug)) {
    throw new Error('CreateOrganization requires "name" and "slug".');
  }
  const authContext = await auth.$context;

  let user = null;
  if (!type.isNone(userId)) {
    user = await authContext.internalAdapter.findUserById(userId);
    if (type.isNone(user)) {
      throw new Error(`CreateOrganization creator "${userId}" is not a user.`);
    }
  }

  const orgPlugin = auth.options.plugins.find((plugin) => plugin.id === 'organization');
  const orgAdapter = getOrgAdapter(authContext, orgPlugin.options);
  // The unique slug index still rejects a create that races this read.
  const existing = await orgAdapter.findOrganizationBySlug(organizationFields.slug);
  if (!type.isNone(existing)) {
    throw new Error(
      `CreateOrganization refused - an organization with slug "${organizationFields.slug}" already exists.`
    );
  }
  // createOrganization spreads the row verbatim and adds no timestamp.
  const organization = await orgAdapter.createOrganization({
    organization: {
      ...organizationFields,
      createdAt: new Date(),
    },
  });

  let member = null;
  if (!type.isNone(user)) {
    const memberData = { userId: user.id, organizationId: organization.id, role: 'owner' };
    // An empty list leaves the row without an appRoles field, as it was before
    // creatorAppRoles existed. A copy, so a routine that mutates the step result
    // cannot change the roles every later organization's owner gets.
    if (organizations.creatorAppRoles.length > 0) {
      memberData.appRoles = [...organizations.creatorAppRoles];
    }
    member = await orgAdapter.createMember(memberData);
  }

  // Adapter-layer writes fire no organizationHooks, so the org plugin's
  // declared afterCreateOrganization is invoked directly, with the endpoint's
  // payload shape ({ organization, member, user }).
  await orgPlugin.options.organizationHooks?.afterCreateOrganization?.({
    organization,
    member,
    user,
  });

  if (type.isNone(member)) {
    return organization;
  }
  // The endpoint's result shape, which routines already read the owner from.
  return { ...organization, members: [member] };
}

// system scope: under the pinned policy organizations are seeded by
// ensureOrganization, under tenant they are minted lazily at session create, and
// allowUserToCreateOrganization: false already says no user creates one. There
// is no organization to hold authority in before this step runs.
CreateOrganization.meta = { authority: { scope: 'system' } };

export default CreateOrganization;
