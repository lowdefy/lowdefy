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
// supportsJSON) on both ends. Fires NO member.update database hooks -
// attributes are admin-set authorization inputs, not user-driven edits.
//
// organizationId is part of the authored property surface but the step never
// resolves it: the floor resolves the target organization (defaulting to the
// pinned one), authorizes the caller there, and passes the result in.
async function UpdateMemberAttributes({ auth, organizationId, properties }) {
  const { attributes, memberId } = properties;
  if (type.isNone(memberId)) {
    throw new Error('UpdateMemberAttributes requires a "memberId" property.');
  }
  if (!type.isObject(attributes)) {
    throw new Error('UpdateMemberAttributes requires an "attributes" object.');
  }
  const { adapter } = await auth.$context;
  const member = await adapter.update({
    model: 'member',
    where: [
      { field: 'id', value: memberId },
      { field: 'organizationId', value: organizationId },
    ],
    update: { attributes },
  });
  if (type.isNone(member)) {
    // Mirrors the rails' member-not-found semantics - a memberId outside the
    // resolved organization must fail loudly, not skip the write silently.
    throw new Error(
      `UpdateMemberAttributes found no member "${memberId}" in organization "${organizationId}".`
    );
  }
  return member;
}

// Attributes are authorization inputs carried on the member row, so setting
// them needs member:update authority in the organization that row belongs to.
UpdateMemberAttributes.meta = {
  authority: { scope: 'org', permissions: { member: ['update'] } },
};

export default UpdateMemberAttributes;
