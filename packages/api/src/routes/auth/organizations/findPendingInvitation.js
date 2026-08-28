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

// Reads the first pending, unexpired invitation for an email - mirroring the
// organization plugin's own findPendingInvitation lookup (lowercased email,
// status "pending", expiry filtered in code). organizationId narrows the
// lookup to one org for the pinned policy; the tenant policy matches any org.
async function findPendingInvitation({ adapter, email, organizationId }) {
  const where = [
    { field: 'email', value: email.toLowerCase() },
    { field: 'status', value: 'pending' },
  ];
  if (!type.isNone(organizationId)) {
    where.push({ field: 'organizationId', value: organizationId });
  }
  const invitations = await adapter.findMany({ model: 'invitation', where });
  return invitations.find((invitation) => new Date(invitation.expiresAt) > new Date()) ?? null;
}

export default findPendingInvitation;
