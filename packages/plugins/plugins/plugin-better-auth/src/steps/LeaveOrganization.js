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

import callPluginEndpoint from './support/callPluginEndpoint.js';

// Ends the caller's own membership of the named organization through the
// organization plugin's leave endpoint, so its checks run: the caller must hold
// a member row there, and the only owner cannot leave. A refusal throws with
// the plugin's message, which a routine catches with :try.
//
// The organization is always named: the step has no org scope, so the floor
// resolves no organization for it, and a leave that fell back to a default
// organization would end the wrong membership.
//
// The caller's session keeps naming the organization they left as active (see
// callPluginEndpoint on the synthetic session token), so their next request
// resolves unauthenticated until the page sets another active organization.
async function LeaveOrganization({ acting, auth, properties }) {
  const { organizationId } = properties;
  if (type.isNone(organizationId)) {
    throw new Error('LeaveOrganization requires an "organizationId" property.');
  }
  return callPluginEndpoint({
    acting,
    auth,
    body: { organizationId },
    endpointKey: 'leaveOrganization',
    pluginId: 'organization',
  });
}

// Leaving touches only the caller's own member row, which every member may
// end, so it needs a caller and no organization authority.
LeaveOrganization.meta = { authority: { scope: 'caller' } };

export default LeaveOrganization;
