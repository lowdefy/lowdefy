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

const allowedProperties = ['image', 'name', 'profile', 'userId'];

// The sanctioned write path for the opaque user.profile bag (display and app
// data - the platform never validates, indexes, or reads inside it). The
// profile update is a shallow merge per top-level key onto the user's
// existing bag - a key set to null is removed - so the row is read first;
// the adapter's json additionalField transform handles storage on both ends.
// name and image are the display copies. The step writes nothing else - not
// email, not emailVerified, not attributes, not roles. Adapter-direct like
// UpdateUserAttributes: fires NO user.update database hooks.
async function UpdateUserProfile({ auth, properties }) {
  const { image, name, profile, userId } = properties;
  const unknownProperties = Object.keys(properties).filter(
    (key) => !allowedProperties.includes(key)
  );
  if (unknownProperties.length > 0) {
    const received = unknownProperties.map((key) => `"${key}"`).join(', ');
    throw new Error(
      `UpdateUserProfile received unknown properties ${received}. ` +
        'Allowed properties are "userId", "profile", "name", and "image".'
    );
  }
  if (type.isNone(userId)) {
    throw new Error('UpdateUserProfile requires a "userId" property.');
  }
  if (!type.isNone(profile) && !type.isObject(profile)) {
    throw new Error(
      `UpdateUserProfile "profile" is not an object. Received ${JSON.stringify(profile)}.`
    );
  }
  if (!type.isNone(name) && !type.isString(name)) {
    throw new Error(`UpdateUserProfile "name" is not a string. Received ${JSON.stringify(name)}.`);
  }
  if (!type.isNone(image) && !type.isString(image)) {
    throw new Error(
      `UpdateUserProfile "image" is not a string. Received ${JSON.stringify(image)}.`
    );
  }
  if (type.isNone(profile) && type.isNone(name) && type.isNone(image)) {
    throw new Error(
      'UpdateUserProfile requires at least one of "profile", "name", or "image" to write.'
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
      if (value === null) {
        delete merged[key];
        return;
      }
      merged[key] = value;
    });
    update.profile = merged;
  }
  if (!type.isNone(name)) {
    update.name = name;
  }
  if (!type.isNone(image)) {
    update.image = image;
  }
  return adapter.update({
    model: 'user',
    where: [{ field: 'id', value: userId }],
    update,
  });
}

export default UpdateUserProfile;
