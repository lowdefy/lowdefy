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

import { isReserved, setKey, type, unsetKey } from '@lowdefy/helpers';

// organizationId is accepted and never read here: the floor reads it to resolve
// the organization the caller's authority and the target's membership are
// checked in, and rejecting it would break every non-self-service save from a
// second admin surface.
const allowedProperties = ['contactId', 'image', 'name', 'organizationId', 'profile', 'userId'];

// The sanctioned write path for the opaque user.profile bag (display and app
// data - the platform never validates, indexes, or reads inside it). The
// profile update is a shallow merge per top-level key onto the user's
// existing bag - a key set to null is removed - so the row is read first;
// the adapter's json additionalField transform handles storage on both ends.
// name and image are the display copies. contactId is the link to the app's
// canonical record for this person - a top-level field, so it is set outright
// and never joins the profile merge. The step writes nothing else - not
// email, not emailVerified, not attributes, not roles. Adapter-direct like
// UpdateUserAttributes: fires NO user.update database hooks.
async function UpdateUserProfile({ auth, organizationId, properties }) {
  const { contactId, image, name, profile, userId } = properties;
  const unknownProperties = Object.keys(properties).filter(
    (key) => !allowedProperties.includes(key)
  );
  if (unknownProperties.length > 0) {
    const received = unknownProperties.map((key) => `"${key}"`).join(', ');
    throw new Error(
      `UpdateUserProfile received unknown properties ${received}. ` +
        'Allowed properties are "userId", "profile", "contactId", "name", "image", and "organizationId".'
    );
  }
  if (type.isNone(userId)) {
    throw new Error('UpdateUserProfile requires a "userId" property.');
  }
  if (!type.isNone(profile) && !type.isObject(profile)) {
    throw new Error('UpdateUserProfile "profile" is not an object.');
  }
  if (!type.isNone(name) && !type.isString(name)) {
    throw new Error('UpdateUserProfile "name" is not a string.');
  }
  if (!type.isNone(image) && !type.isString(image)) {
    throw new Error('UpdateUserProfile "image" is not a string.');
  }
  if (!type.isNone(contactId) && !type.isString(contactId)) {
    throw new Error('UpdateUserProfile "contactId" is not a string.');
  }
  if (type.isNone(profile) && type.isNone(contactId) && type.isNone(name) && type.isNone(image)) {
    throw new Error(
      'UpdateUserProfile requires at least one of "profile", "contactId", "name", or "image" to write.'
    );
  }
  const { adapter } = await auth.$context;
  const user = await adapter.findOne({
    model: 'user',
    where: [{ field: 'id', value: userId }],
  });
  if (type.isNone(user)) {
    // Mirrors UpdateUserAttributes - an unknown userId must fail loudly,
    // not skip the write silently.
    throw new Error(`UpdateUserProfile found no user with id "${userId}".`);
  }
  const update = {};
  if (!type.isNone(profile)) {
    const merged = { ...(user.profile ?? {}) };
    Object.entries(profile).forEach(([key, value]) => {
      if (isReserved(key)) {
        throw new Error(
          `UpdateUserProfile profile field "${key}" is a reserved key and cannot be written to the user profile.`
        );
      }
      if (value === null) {
        unsetKey(merged, key);
        return;
      }
      setKey(merged, key, value);
    });
    update.profile = merged;
  }
  if (!type.isNone(contactId)) {
    update.contactId = contactId;
  }
  if (!type.isNone(name)) {
    update.name = name;
  }
  if (!type.isNone(image)) {
    update.image = image;
  }
  const updatedUser = await adapter.update({
    model: 'user',
    where: [{ field: 'id', value: userId }],
    update,
  });
  // Denormalize the display copies onto the target's member row in the
  // organization the floor resolved (organizationId is the floor's resolved
  // target, like UpdateMemberAttributes). The user row is deployment-global and
  // last-edit-wins across workspaces; the member copy carries the identity as
  // saved in THIS organization, and resolveMemberCaller prefers it, so change
  // stamps and the header identity name the workspace's identity (T18). Empty
  // strings are not written - resolveMemberCaller coalesces on nullish, so an
  // empty member copy would mask the global fallback. No member row is a
  // silent skip, not an error: selfTargetExempt lets a caller save their own
  // profile without holding a member row in the resolved organization, and the
  // global write above has already landed.
  const memberUpdate = {};
  if (!type.isNone(name) && name !== '') {
    memberUpdate.name = name;
  }
  if (!type.isNone(image) && image !== '') {
    memberUpdate.image = image;
  }
  if (!type.isNone(organizationId) && Object.keys(memberUpdate).length > 0) {
    await adapter.update({
      model: 'member',
      where: [
        { field: 'userId', value: userId },
        { field: 'organizationId', value: organizationId },
      ],
      update: memberUpdate,
    });
  }
  return updatedUser;
}

// The self-service save is the core flow: selfTargetExempt names the property
// compared to the caller's own id, and when properties.userId is that id the
// floor skips its check entirely - evaluated before the scope check, so a
// person saves their own profile without any org authority and without holding
// a member row in the organization the request names. Profile, contactId, name
// and image are display, link and app data - no authorization check reads any
// of them, so the exemption holds for contactId too. Targeting anyone else
// writes the deployment-wide user row, so it needs user:update authority in an
// organization the target holds a member row in - membership is the
// relationship that makes that person the caller's business.
UpdateUserProfile.meta = {
  authority: {
    scope: 'org',
    permissions: { user: ['update'] },
    targetUser: 'userId',
    selfTargetExempt: 'userId',
  },
};

export default UpdateUserProfile;
