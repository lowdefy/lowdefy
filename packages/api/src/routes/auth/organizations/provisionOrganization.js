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

import ensureAuthIndexes from './ensureAuthIndexes.js';
import { getRegisteredOrganization } from './getOrganizationBinding.js';
import mintOrganization from './mintOrganization.js';

async function findOrganization({ adapter, slug }) {
  return adapter.findOne({
    model: 'organization',
    where: [{ field: 'slug', value: slug }],
  });
}

// A provisioned organization has no creator - membership arrives by
// invitation - so it is one write. A slug that is taken, or taken by a racing
// write the unique slug index rejects, is refused.
async function createCreatorlessOrganization({ adapter, data }) {
  if (!type.isNone(await findOrganization({ adapter, slug: data.slug }))) {
    return null;
  }
  try {
    return await adapter.create({
      model: 'organization',
      data: { ...data, createdAt: new Date() },
    });
  } catch (error) {
    if (!type.isNone(await findOrganization({ adapter, slug: data.slug }))) {
      return null;
    }
    throw error;
  }
}

// The CreateOrganization step's write, handed to every auth step by
// handleAuthStep. With a creator, the organization and its owner row holding
// auth.organizations.creatorAppRoles are written by mintOrganization, the same
// way the tenant signup mint writes them, so a run that fails between the two
// writes is finished by the creator's next run for the same slug.
//
// Returns { organization, member } - member is null without a creator - or
// null when the slug belongs to another organization. organization is shaped
// the way the org plugin's endpoints return it: without the server-only marker
// fields, and with metadata parsed from the JSON string the row stores.
async function provisionOrganization({ auth, logger, organization: fields, userId }) {
  // A refused slug is only a guarantee behind the unique slug index - a read
  // cannot see a racing write - so nothing is written without it.
  await ensureAuthIndexes({ auth, logger });
  const { adapter } = await auth.$context;
  const data = { ...fields };
  if (!type.isNone(fields.metadata)) {
    data.metadata = JSON.stringify(fields.metadata);
  }

  let organization;
  let member = null;
  if (type.isNone(userId)) {
    organization = await createCreatorlessOrganization({ adapter, data });
  } else {
    const minted = await mintOrganization({
      adapter,
      creatorAppRoles: getRegisteredOrganization({ auth }).creatorAppRoles,
      organization: data,
      userId,
    });
    organization = minted?.organization ?? null;
    member = minted?.member ?? null;
  }
  if (type.isNone(organization)) {
    return null;
  }

  const result = { ...organization };
  delete result.mintPending;
  delete result.mintCreatorId;
  if (type.isString(result.metadata)) {
    result.metadata = JSON.parse(result.metadata);
  }
  return { organization: result, member };
}

export default provisionOrganization;
