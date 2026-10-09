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

import assertMcpTokenModel from './support/assertMcpTokenModel.js';

// Switches off any member token in the organization the floor authorized - an
// owner or admin overseeing the organization's tokens. The token must belong
// to that organization; one in another organization is not found, the same as
// one that does not exist.
async function RevokeOrgMcpToken({ auth, organizationId, properties }) {
  assertMcpTokenModel({ auth, stepName: 'RevokeOrgMcpToken' });
  const { id } = properties ?? {};
  if (!type.isString(id)) {
    throw new Error(
      `RevokeOrgMcpToken requires a string "id" property. Received ${JSON.stringify(id)}.`
    );
  }
  const { adapter } = await auth.$context;
  const row = await adapter.findOne({
    model: 'mcpToken',
    where: [
      { field: 'id', value: id },
      { field: 'organizationId', value: organizationId },
    ],
  });
  if (type.isNone(row)) {
    throw new Error(`RevokeOrgMcpToken found no token with id "${id}" in this organization.`);
  }
  await adapter.delete({ model: 'mcpToken', where: [{ field: 'id', value: row.id }] });
  // Returned so routines can log whose token was switched off - never the hash.
  return {
    id: row.id,
    userId: row.userId,
    memberId: row.memberId,
    name: row.name,
    start: row.start,
  };
}

// Overseeing members is member:update authority - owners and admins by default.
RevokeOrgMcpToken.meta = {
  authority: { scope: 'org', permissions: { member: ['update'] } },
};

export default RevokeOrgMcpToken;
