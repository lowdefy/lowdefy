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

import resolveUnwalledReach from './resolveUnwalledReach.js';

// Refuses a request on an unwalled connection that holds a URI to a walled
// database (resolveUnwalledReach). Only that connection's requests fail: the
// rest of the app is served.
async function checkUnwalledReach(context, { connectionConfig }) {
  if (context.organization?.policy !== 'tenant') return;
  if (connectionConfig.tenantCapability !== false) return;
  const reach = await resolveUnwalledReach(context);
  const message = reach.get(connectionConfig.connectionId);
  if (!message) return;
  const err = new ConfigError(message, { configKey: connectionConfig['~k'] });
  context.logger.debug({ params: { connectionId: connectionConfig.connectionId }, err }, message);
  throw err;
}

export default checkUnwalledReach;
