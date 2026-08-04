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
// joined to the user). A caller-less run has no real member row, so this wrapper
// intercepts exactly that lookup and returns a virtual member (in-memory only;
// never written) claiming "owner". owner/admin/member are the only roles the org
// plugin registers, under both policies, and owner holds every statement - so
// the fabricated row passes the plugin's hasPermission check. It also passes the
// creator-protection guards (crud-members.mjs:173-181, 399-407), which compare
// role strings against creatorRole literally and demand the caller hold it to
// touch a member who does.
//
// Applies only to caller-less runs (acting.system === true) and to admin-plugin
// endpoints; the step floor owns that boundary and decides when to wrap. Every
// other adapter call delegates to the real adapter unchanged.
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
          role: 'owner',
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
