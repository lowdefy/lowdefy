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

import getPluginEndpoint from './support/getPluginEndpoint.js';
import invokeEndpoint from './support/invokeEndpoint.js';

// The engine config sets allowUserToCreateOrganization: false; the endpoint
// bypasses that switch only for "system actions" - a call with NO session, NO
// headers, and an explicit body.userId which becomes the creator/owner. So this
// step must not inject an acting session or pass a headers key at all.
async function CreateOrganization({ acting, auth, properties }) {
  const userId = properties.userId ?? acting.user?.id;
  if (type.isNone(userId)) {
    throw new Error('CreateOrganization requires a "userId" property when run by the system.');
  }
  const authContext = await auth.$context;
  const endpoint = getPluginEndpoint({
    authContext,
    endpointKey: 'createOrganization',
    pluginId: 'organization',
  });
  return invokeEndpoint({
    endpoint,
    input: {
      body: { ...properties, userId },
      context: { ...authContext },
    },
  });
}

export default CreateOrganization;
