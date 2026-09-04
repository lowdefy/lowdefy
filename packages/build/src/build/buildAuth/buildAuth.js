/* eslint-disable no-param-reassign */

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

import buildAuthHooks from './buildAuthHooks.js';
import buildAuthPlugins from './buildAuthPlugins.js';
import buildAgentAuth from './buildAgentAuth.js';
import buildAuthStrategies from './buildAuthStrategies.js';
import buildEntityAuth from './buildEntityAuth.js';
import buildRoleCatalog from './buildRoleCatalog.js';
import buildTrustedProviders from './buildTrustedProviders.js';
import buildTwoFactorTrustedProviders from './buildTwoFactorTrustedProviders.js';
import { getEntityDefaultProtected } from './getProtectedEntities.js';
import setAuthConfigured from './setAuthConfigured.js';
import setAuthDefaults from './setAuthDefaults.js';
import validateAuthConfig from './validateAuthConfig.js';
import validateAuthDev from './validateAuthDev.js';

function buildAuth({ components, context }) {
  validateAuthConfig({ components, context });
  validateAuthDev({ components, context });
  setAuthConfigured({ components, context });
  setAuthDefaults({ components, context });
  buildRoleCatalog({ components, context });
  buildTrustedProviders({ components, context });
  buildTwoFactorTrustedProviders({ components, context });
  buildAuthHooks({ components, context });
  buildAuthStrategies({ components, context });
  buildEntityAuth({ components, context, entity: 'api' });
  buildEntityAuth({ components, context, entity: 'websockets' });
  buildEntityAuth({ components, context, entity: 'pages' });
  // Agents are served from the API surface, so auth.api patterns match agent ids too.
  buildAgentAuth({ components, context });

  // The protection an unlisted page id inherits, resolved once for the runtime -
  // the signed-out page fork reads it instead of consulting page existence
  // (Decision 7). Pages only: the request and endpoint surfaces need no such
  // default - a session-less human gets 401 for every id in an auth'd app,
  // present or absent, with no per-entity boolean.
  components.auth.pagesProtectedByDefault = getEntityDefaultProtected({
    components,
    entity: 'pages',
  });

  buildAuthPlugins({ components, context });

  return components;
}

export default buildAuth;
