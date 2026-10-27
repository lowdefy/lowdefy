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

import isActiveMember from './isActiveMember.js';

// How long a minted organization's owner row may take to follow it. A mint
// writes both rows within one request, so a marker older than this is left
// over from a mint that failed between its writes.
const mintPendingMs = 10 * 60 * 1000;

// An organization and its creator's owner row, written by the engine itself:
// the tenant signup mint (createActiveOrgPolicyHook) and the CreateOrganization
// step (provisionOrganization) both write them here. Both go through the
// adapter rather than the org plugin's createOrganization endpoint, so none of
// that endpoint's options (creatorRole, organizationLimit, teams) or
// organizationHooks apply - buildOrganizationPlugin declares none of them, and
// its tests hold it to that.
//
// There are no transactions to lean on (the adapter supports standalone
// MongoDB), so the mint is two writes made safe by unique indexes
// (ensureAuthIndexes, which every caller awaits first) and a marker:
//
// - The organization row is written with mintPending: true and the creator's
//   id in mintCreatorId. Only a marked organization whose mint is still in
//   progress (isMintInProgress) is ever joined as its owner here: one minted
//   for this creator moments ago whose owner row was never written - a mint
//   that failed between its two writes, or one a concurrent run for the same
//   creator (a double submit, two tabs) is finishing right now. The marker is
//   cleared once the owner row exists, so an organization everyone later left -
//   with its data and pending invitations - is never handed back.
// - Two runs creating the same slug: the unique slug index rejects the second,
//   which reads the winner's row. It joins that row only if the winner's mint
//   is for the same creator and still in progress; another creator's mint is
//   left alone.
// - Two runs writing the owner row, in any order around each other's writes:
//   the unique (user, organization) index rejects the second, which reads the
//   winner's row. The member row is always written before the marker is
//   cleared, so a run that sees the marker cleared finds the member row.
async function findOrganization({ adapter, slug }) {
  return adapter.findOne({
    model: 'organization',
    where: [{ field: 'slug', value: slug }],
  });
}

async function findMember({ adapter, userId, organizationId }) {
  return adapter.findOne({
    model: 'member',
    where: [
      { field: 'userId', value: userId },
      { field: 'organizationId', value: organizationId },
    ],
  });
}

async function findOrCreateOrganization({ adapter, data, userId }) {
  const existing = await findOrganization({ adapter, slug: data.slug });
  if (existing) {
    return existing;
  }
  try {
    return await adapter.create({
      model: 'organization',
      data: { ...data, mintPending: true, mintCreatorId: userId, createdAt: new Date() },
    });
  } catch (error) {
    const winner = await findOrganization({ adapter, slug: data.slug });
    if (!winner) {
      throw error;
    }
    return winner;
  }
}

async function joinAsOwner({ adapter, creatorAppRoles, userId, organizationId }) {
  const data = { userId, organizationId, role: 'owner', createdAt: new Date() };
  // An empty list leaves the row without an appRoles field, as it was before
  // creatorAppRoles existed. A copy, so a caller that mutates the returned row
  // cannot change the roles every later organization's owner gets.
  if (creatorAppRoles.length > 0) {
    data.appRoles = [...creatorAppRoles];
  }
  try {
    return await adapter.create({ model: 'member', data });
  } catch (error) {
    const winner = await findMember({ adapter, userId, organizationId });
    if (type.isNone(winner)) {
      throw error;
    }
    return winner;
  }
}

async function clearMintPending({ adapter, organization }) {
  if (organization.mintPending !== true) {
    return;
  }
  await adapter.update({
    model: 'organization',
    where: [{ field: 'id', value: organization.id }],
    update: { mintPending: false },
  });
}

// A marker naming another creator belongs to that creator's mint, finished or
// not, so it is neither joined nor cleared here. A marker with no
// mintCreatorId was written before the field existed, by the signup mint,
// whose slug already names its creator.
function isOtherCreatorsMint({ organization, userId }) {
  return (
    organization.mintPending === true &&
    !type.isNone(organization.mintCreatorId) &&
    organization.mintCreatorId !== userId
  );
}

// A marked organization is joined as owner only while its mint is in
// progress: minted within mintPendingMs and with no member other than the
// creator. A marker older than that, or on an organization other people belong
// to, is left over from a mint that wrote the owner row and failed before
// clearing it - the organization has had an owner, so it is never handed back.
async function isMintInProgress({ adapter, organization, userId }) {
  if (organization.mintPending !== true) {
    return false;
  }
  if (Date.now() - new Date(organization.createdAt).getTime() > mintPendingMs) {
    return false;
  }
  const otherMembers = await adapter.count({
    model: 'member',
    where: [
      { field: 'organizationId', value: organization.id },
      { field: 'userId', value: userId, operator: 'ne' },
    ],
  });
  return otherMembers === 0;
}

// Returns { organization, member } once userId owns the organization at
// organization.slug, or null when that slug belongs to an organization this
// mint may not take. A stale marker found on the way is cleared.
//
// keepMembership: an unmarked organization the creator already belongs to,
// unsuspended, counts as theirs. The signup mint needs it - a concurrent session of the
// same user may have finished the mint between that user's membership read and
// this call. The CreateOrganization step leaves it off: an organization that
// already exists is refused, whoever belongs to it.
async function mintOrganization({
  adapter,
  creatorAppRoles,
  keepMembership = false,
  organization: data,
  userId,
}) {
  const organization = await findOrCreateOrganization({ adapter, data, userId });
  if (isOtherCreatorsMint({ organization, userId })) {
    return null;
  }
  const member = await findMember({ adapter, userId, organizationId: organization.id });
  // A membership the creator is suspended in is not theirs to sign in to, so
  // the signup mint moves on to the next slug, as for an organization they
  // left - whether or not the organization is still marked mid-mint.
  if (!type.isNone(member) && !isActiveMember({ member })) {
    return null;
  }
  if (!type.isNone(member) && (keepMembership || organization.mintPending === true)) {
    await clearMintPending({ adapter, organization });
    return { organization, member };
  }
  if (await isMintInProgress({ adapter, organization, userId })) {
    const owner = await joinAsOwner({
      adapter,
      creatorAppRoles,
      userId,
      organizationId: organization.id,
    });
    await clearMintPending({ adapter, organization });
    return { organization, member: owner };
  }
  await clearMintPending({ adapter, organization });
  return null;
}

export default mintOrganization;
