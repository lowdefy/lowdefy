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

// Org mutation endpoints authorize the CALLER by looking up their member row
// (findMemberByOrgId -> adapter.findOne on "member" by userId + organizationId,
// joined to the user). Admin steps act with server authority, so the acting user
// has no real member row. This wrapper intercepts exactly that lookup and returns
// a virtual member (in-memory only; never written) claiming the reserved
// "$lowdefy-system" authority role. That role is registered by the org plugin
// with the authority statements the mutations require and is the creator under
// the pinned wiring, so the fabricated row passes both the plugin's
// hasPermission check and its creator-protection guards. Every other adapter
// call delegates to the real adapter unchanged.
function createActingMemberAdapter({ actingUser, adapter }) {
  async function findOne(args) {
    if (args.model === 'member' && type.isArray(args.where)) {
      const userIdClause = args.where.find((clause) => clause.field === 'userId');
      const organizationIdClause = args.where.find((clause) => clause.field === 'organizationId');
      if (
        !type.isNone(userIdClause) &&
        userIdClause.value === actingUser.id &&
        !type.isNone(organizationIdClause)
      ) {
        return {
          id: 'lowdefy:system-member',
          userId: actingUser.id,
          organizationId: organizationIdClause.value,
          role: '$lowdefy-system',
          createdAt: new Date(),
          user: {
            id: actingUser.id,
            name: actingUser.name,
            email: actingUser.email,
            image: actingUser.image,
          },
        };
      }
    }
    return adapter.findOne(args);
  }

  return { ...adapter, findOne };
}

export default createActingMemberAdapter;
