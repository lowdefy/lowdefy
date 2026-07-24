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

import { ConfigError } from '@lowdefy/errors';

// The per-org client actions ride the organization plugin's client HTTP
// endpoints, which are disabled under the "pinned" organizations policy - a
// wired instance can only 404 at runtime there, and per-org self-service is
// meaningless on a single-org pinned deployment. A hard ConfigError turns
// that silent runtime break into an early, legible build error that blocks
// both dev and prod (unlike validateCallApiRefs's prodError warning, which
// only fails prod).
export const ORG_CLIENT_ACTION_TYPES = [
  'CancelInvitation',
  'InviteMember',
  'LeaveOrganization',
  'RemoveMember',
  'SetActiveOrganization',
  'UpdateMemberRole',
  'UpdateOrganization',
];

function validateOrgClientActionRefs({ orgClientActionRefs, policy }) {
  if (policy !== 'pinned') {
    return;
  }
  const [firstRef] = orgClientActionRefs;
  if (!firstRef) {
    return;
  }
  const { action, sourcePageId } = firstRef;
  throw new ConfigError(
    `${action.type} action on page "${sourcePageId}" is not allowed under the "pinned" organizations policy - the per-organization client endpoints are disabled for a pinned deployment.`,
    { configKey: action['~k'] }
  );
}

export default validateOrgClientActionRefs;
