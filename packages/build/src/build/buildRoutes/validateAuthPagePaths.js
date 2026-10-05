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
import authPageUrlPath from './authPageUrlPath.js';
import findAuthPageRoute from './findAuthPageRoute.js';
import routeHasPlaceholders from './routeHasPlaceholders.js';

// The route of the page an auth page URL names by id when that page is served
// at a path of its own.
function findRouteNamedById({ routes, url }) {
  const urlPath = authPageUrlPath({ url });
  return routes.find((route) => route.pageId === urlPath && route.path !== urlPath) ?? null;
}

function placeholderError({ role, route }) {
  return new ConfigError(
    `Page "${route.pageId}" is the "auth.authPages.${role}" page, so its path "${route.path}" cannot have placeholders. Auth pages are redirect targets, with no values to fill them.`,
    { configKey: route.configKey }
  );
}

function servedElsewhereError({ role, route, url }) {
  return new ConfigError(
    `Auth "authPages.${role}" is "${url}", but page "${route.pageId}" is served at its path "/${route.path}", and no page is served at "${url}". Set authPages.${role} to "/${route.path}".`,
    { configKey: route.configKey }
  );
}

// Auth pages are redirect targets: the framework has no values to fill
// placeholders with, and the URL must be the one the page is served at. Runs
// after buildAuth, once module contributions and defaults have filled
// auth.authPages.
function validateAuthPagePaths({ components, context }) {
  const authPages = components.auth?.authPages ?? {};
  for (const [role, url] of Object.entries(authPages)) {
    if (role.startsWith('~')) {
      continue;
    }
    const route = findAuthPageRoute({ routes: context.routes, url });
    if (!type.isNull(route)) {
      if (routeHasPlaceholders({ route })) {
        collectExceptions(context, placeholderError({ role, route }));
      }
      continue;
    }
    const namedRoute = findRouteNamedById({ routes: context.routes, url });
    if (type.isNull(namedRoute)) {
      continue;
    }
    if (routeHasPlaceholders({ route: namedRoute })) {
      collectExceptions(context, placeholderError({ role, route: namedRoute }));
      continue;
    }
    collectExceptions(context, servedElsewhereError({ role, route: namedRoute, url }));
  }
  return components;
}

export default validateAuthPagePaths;
