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
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../../utils/collectExceptions.js';
import findAuthPageRoute from './findAuthPageRoute.js';
import routeHasPlaceholders from './routeHasPlaceholders.js';

// Auth pages are redirect targets, so the framework has no values to fill
// placeholders with. Runs after buildAuth, once module contributions and
// defaults have filled auth.authPages.
function validateAuthPagePaths({ components, context }) {
  const authPages = components.auth?.authPages ?? {};
  for (const [role, url] of Object.entries(authPages)) {
    if (role.startsWith('~')) {
      continue;
    }
    const route = findAuthPageRoute({ routes: context.routes, url });
    if (type.isNone(route) || !routeHasPlaceholders({ route })) {
      continue;
    }
    collectExceptions(
      context,
      new ConfigError(
        `Page "${route.pageId}" is the "auth.authPages.${role}" page, so its path "${route.path}" cannot have placeholders. Auth pages are redirect targets, with no values to fill them.`,
        { configKey: route.configKey }
      )
    );
  }
  return components;
}

export default validateAuthPagePaths;
