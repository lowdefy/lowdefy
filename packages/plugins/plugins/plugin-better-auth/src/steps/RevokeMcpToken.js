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

// Switches off one of the caller's own member tokens by deleting its row - the
// MCP route refuses it on its next call. A token that is someone else's and a
// token that does not exist get the same not-found error, so the step never
// confirms the id of another member's token.
async function RevokeMcpToken({ acting, auth, properties }) {
  assertMcpTokenModel({ auth, stepName: 'RevokeMcpToken' });
  const { id } = properties ?? {};
  if (!type.isString(id)) {
    throw new Error(
      `RevokeMcpToken requires a string "id" property. Received ${JSON.stringify(id)}.`
    );
  }
  const { adapter } = await auth.$context;
  const row = await adapter.findOne({
    model: 'mcpToken',
    where: [
      { field: 'id', value: id },
      { field: 'userId', value: acting.user.id },
    ],
  });
  if (type.isNone(row)) {
    throw new Error(`RevokeMcpToken found no token with id "${id}".`);
  }
  await adapter.delete({ model: 'mcpToken', where: [{ field: 'id', value: row.id }] });
  // Returned so routines can write audit events - never the hash.
  return {
    id: row.id,
    userId: row.userId,
    memberId: row.memberId,
    name: row.name,
    start: row.start,
  };
}

// The step deletes only a token the caller owns, so it needs a caller and no
// organization authority.
RevokeMcpToken.meta = { authority: { scope: 'caller' } };

export default RevokeMcpToken;
