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

import { APIError } from 'better-auth/api';
import { type } from '@lowdefy/helpers';

// Every MCP access token carries the organization its grant acts in as the
// organization_id claim - the consent referenceId (buildOauthPostLogin). The
// refresh grant re-stamps that reference without asking whether the user still
// belongs to the organization, so a member who left or was removed would keep
// refreshing into tokens the MCP route refuses: the client refreshes, retries,
// gets the same 401 and gives up, and never re-runs sign-in and the
// organization choice. Refusing the mint with invalid_grant is what sends an
// OAuth client back through authorization.
function createMcpAccessTokenClaims({ getAuth }) {
  return async function mcpAccessTokenClaims({ user, referenceId }) {
    const { adapter } = await getAuth().$context;
    const member = await adapter.findOne({
      model: 'member',
      where: [
        { field: 'userId', value: user.id },
        { field: 'organizationId', value: referenceId },
      ],
    });
    if (type.isNone(member)) {
      throw new APIError('BAD_REQUEST', {
        error: 'invalid_grant',
        error_description:
          'The user is no longer a member of the organization this grant acts in. Authorize again to choose an organization.',
      });
    }
    return { organization_id: referenceId };
  };
}

export default createMcpAccessTokenClaims;
