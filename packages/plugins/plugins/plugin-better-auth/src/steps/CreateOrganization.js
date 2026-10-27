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

const organizationProperties = ['name', 'slug', 'logo', 'metadata'];

// The org plugin's createOrganization endpoint body schema does not run on
// this path (see CreateOrganization), so the step checks the properties
// itself: the endpoint's name, slug, logo and metadata, and userId. The org
// plugin declares no additional organization fields a routine may set.
function checkProperties(properties) {
  const unknown = Object.keys(properties).filter(
    (key) => key !== 'userId' && !organizationProperties.includes(key)
  );
  if (unknown.length > 0) {
    throw new Error(
      `CreateOrganization does not take ${unknown
        .map((key) => `"${key}"`)
        .join(', ')}. It takes "name", "slug", "logo", "metadata" and "userId".`
    );
  }
  const { logo, metadata, name, slug, userId } = properties;
  if (!type.isString(name) || name === '') {
    throw new Error('CreateOrganization requires a "name" string property.');
  }
  if (!type.isString(slug) || slug === '') {
    throw new Error('CreateOrganization requires a "slug" string property.');
  }
  if (!type.isNone(logo) && !type.isString(logo)) {
    throw new Error('CreateOrganization requires a "logo" string property.');
  }
  if (!type.isNone(metadata) && !type.isObject(metadata)) {
    throw new Error('CreateOrganization requires a "metadata" object property.');
  }
  if (!type.isNone(userId) && (!type.isString(userId) || userId === '')) {
    throw new Error('CreateOrganization requires "userId" to be a user id string.');
  }
}

// The rows are written by the engine's provisionOrganization, not the org
// plugin's createOrganization endpoint. The endpoint mints its creator as an
// owner member with no app roles, so granting auth.organizations.creatorAppRoles
// would take a second write, and undoing both rows when that one failed. The
// engine writes the owner row with its app roles in the one write, the same
// way the tenant signup mint does, and a run that fails between the
// organization and owner writes is finished by the creator's next run for the
// same slug.
//
// A provisioned organization has no creator - membership arrives by
// invitation - so without a userId it gets no member row. The step is
// system-scoped, so there is no caller to default the creator to.
async function CreateOrganization({ auth, properties, provisionOrganization }) {
  checkProperties(properties);
  const { userId } = properties;
  const organization = {};
  organizationProperties.forEach((key) => {
    if (!type.isNone(properties[key])) {
      organization[key] = properties[key];
    }
  });

  if (!type.isNone(userId)) {
    const { internalAdapter } = await auth.$context;
    const user = await internalAdapter.findUserById(userId);
    if (type.isNone(user)) {
      throw new Error(`CreateOrganization creator "${userId}" is not a user.`);
    }
  }

  const provisioned = await provisionOrganization({ organization, userId });
  if (type.isNone(provisioned)) {
    throw new Error(
      `CreateOrganization refused - an organization with slug "${organization.slug}" already exists.`
    );
  }
  if (type.isNone(provisioned.member)) {
    return provisioned.organization;
  }
  // The endpoint's result shape, which routines already read the owner from.
  return { ...provisioned.organization, members: [provisioned.member] };
}

// system scope: under the pinned policy organizations are seeded by
// ensureOrganization, under tenant they are minted lazily at session create, and
// allowUserToCreateOrganization: false already says no user creates one. There
// is no organization to hold authority in before this step runs.
CreateOrganization.meta = { authority: { scope: 'system' } };

export default CreateOrganization;
