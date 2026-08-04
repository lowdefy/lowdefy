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

// Adapter-direct per the mongodb design Decision 5: the adapter applies the
// json additionalField transform (native sub-document storage on MongoDB via
// supportsJSON) on both ends. Fires NO user.update database hooks -
// attributes are admin-set authorization inputs, not user-driven edits.
async function UpdateUserAttributes({ auth, properties }) {
  const { attributes, userId } = properties;
  if (type.isNone(userId)) {
    throw new Error('UpdateUserAttributes requires a "userId" property.');
  }
  if (!type.isObject(attributes)) {
    throw new Error(
      `UpdateUserAttributes requires an "attributes" object. Received ${JSON.stringify(
        attributes
      )}.`
    );
  }
  const { adapter } = await auth.$context;
  const user = await adapter.update({
    model: 'user',
    where: [{ field: 'id', value: userId }],
    update: { attributes },
  });
  if (type.isNone(user)) {
    // Mirrors UpdateMemberAttributes - an unknown userId must fail loudly,
    // not skip the write silently.
    throw new Error(`UpdateUserAttributes found no user with id "${userId}".`);
  }
  return user;
}

// Attributes are authorization inputs on the deployment-wide user row, so org
// authority alone would let an administrator of any organization rewrite any
// user's inputs. targetUser makes the floor require the target to hold a member
// row in the organization the caller administers.
UpdateUserAttributes.meta = {
  authority: { scope: 'org', permissions: { user: ['set-attributes'] }, targetUser: 'userId' },
};

export default UpdateUserAttributes;
