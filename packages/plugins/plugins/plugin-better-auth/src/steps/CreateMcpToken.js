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

import { createHash, randomBytes } from 'node:crypto';

import { type } from '@lowdefy/helpers';

import assertMcpTokenModel from './support/assertMcpTokenModel.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Creates a member token for the caller in their active organization - the
// long-lived bearer a script sends to /api/mcp to be served as that member.
// The token is returned here and nowhere else: only its SHA-256 and its first
// 12 characters are stored.
//
// Only a person signed in with a session creates one. Every other caller
// carries auth_method - an MCP caller (OAuth grant or member token) "mcp", an
// API strategy caller its strategy type - and the caller-scope floor admits
// them all. Without this check an OAuth agent could turn its grant into a
// token that outlives RevokeMcpGrant, a member token could mint a fresh one
// past the expiry its maker chose, and a read-only grant could mint a token
// with write.
//
// The token records the member row it was made for: the MCP route accepts it
// only while that row stands, so leaving, removal or deletion ends it.
async function CreateMcpToken({ acting, auth, properties }) {
  if (!type.isNone(acting.user.auth_method)) {
    throw new Error(
      'CreateMcpToken only runs for a person signed in with a session - member tokens are created from a signed-in session, never by an agent, a script or another token.'
    );
  }
  assertMcpTokenModel({ auth, stepName: 'CreateMcpToken' });
  const { name, expiresInDays } = properties ?? {};
  if (!type.isString(name) || name.trim() === '') {
    throw new Error('CreateMcpToken requires a non-empty string "name" property.');
  }
  if (type.isUndefined(expiresInDays)) {
    throw new Error(
      'CreateMcpToken requires an "expiresInDays" property - a positive whole number of days, or null for a token that never expires.'
    );
  }
  if (!type.isNull(expiresInDays) && !(type.isInt(expiresInDays) && expiresInDays > 0)) {
    throw new Error(
      `CreateMcpToken "expiresInDays" must be a positive whole number of days, or null for a token that never expires. Received ${JSON.stringify(
        expiresInDays
      )}.`
    );
  }
  const createdAt = new Date();
  const expiresAt = type.isNull(expiresInDays)
    ? null
    : new Date(createdAt.getTime() + expiresInDays * DAY_MS);
  if (!type.isNull(expiresAt) && Number.isNaN(expiresAt.getTime())) {
    throw new Error(
      `CreateMcpToken "expiresInDays" is past the latest date that can be stored. Received ${JSON.stringify(
        expiresInDays
      )}. Use null for a token that never expires.`
    );
  }
  const userId = acting.user.id;
  const organizationId = acting.user.organization_id;
  if (type.isNone(organizationId)) {
    throw new Error('CreateMcpToken needs the caller to have an active organization.');
  }
  const { adapter } = await auth.$context;
  const member = await adapter.findOne({
    model: 'member',
    where: [
      { field: 'userId', value: userId },
      { field: 'organizationId', value: organizationId },
    ],
  });
  if (type.isNone(member)) {
    throw new Error(
      `CreateMcpToken found no member row for the caller in organization "${organizationId}".`
    );
  }
  const token = `ldf_mcp_${randomBytes(32).toString('base64url')}`;
  const start = token.slice(0, 12);
  const row = await adapter.create({
    model: 'mcpToken',
    data: {
      organizationId,
      userId,
      memberId: member.id,
      name: name.trim(),
      hash: createHash('sha256').update(token).digest('hex'),
      start,
      createdAt,
      expiresAt,
      lastUsedAt: null,
    },
  });
  return { id: row.id, token, start, expiresAt };
}

// The token acts as the caller and is written for the caller's own member row,
// so it needs a caller and no organization authority.
CreateMcpToken.meta = { authority: { scope: 'caller' } };

export default CreateMcpToken;
