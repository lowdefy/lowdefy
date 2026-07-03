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

import buildApiAuth from './buildApiAuth.js';
import buildAuthHooks from './buildAuthHooks.js';
import buildAuthPlugins from './buildAuthPlugins.js';
import buildAuthStrategies from './buildAuthStrategies.js';
import buildPageAuth from './buildPageAuth.js';
import buildRoleCatalog from './buildRoleCatalog.js';
import buildTrustedProviders from './buildTrustedProviders.js';
import buildWebsocketAuth from './buildWebsocketAuth.js';
import setAuthConfigured from './setAuthConfigured.js';
import setAuthDefaults from './setAuthDefaults.js';
import validateAuthConfig from './validateAuthConfig.js';

function buildAuth({ components, context }) {
  validateAuthConfig({ components, context });
  setAuthConfigured({ components, context });
  setAuthDefaults({ components, context });
  buildRoleCatalog({ components, context });
  buildTrustedProviders({ components, context });
  buildAuthHooks({ components, context });
  buildAuthStrategies({ components, context });
  buildApiAuth({ components, context });
  buildWebsocketAuth({ components, context });
  buildPageAuth({ components, context });
  buildAuthPlugins({ components, context });

  return components;
}

export default buildAuth;
