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
import routeHasPlaceholders from './routeHasPlaceholders.js';

// The home page and the 404 page are served at addresses the framework writes,
// with no values to fill placeholders: "/" for the configured home page, and
// "/404", where every URL that matches no page is redirected.
function validateFrameworkPagePaths({ components, routes, context }) {
  const notFoundPage = (components.pages ?? []).find((page) => page.id === '404');
  if (!type.isUndefined(notFoundPage?.path)) {
    collectExceptions(
      context,
      new ConfigError(
        'Page "404" cannot have a path. Every URL that matches no page is redirected to "/404".',
        { received: notFoundPage.path, configKey: notFoundPage['~k'] }
      )
    );
  }

  const homePageId = components.config?.homePageId;
  if (!type.isString(homePageId)) {
    return;
  }
  const homeRoute = routes.find((route) => route.pageId === homePageId);
  if (!type.isUndefined(homeRoute) && routeHasPlaceholders({ route: homeRoute })) {
    collectExceptions(
      context,
      new ConfigError(
        `Page "${homePageId}" is the home page ("config.homePageId"), so its path "${homeRoute.path}" cannot have placeholders. The home page is served at "/", with no values to fill them.`,
        { configKey: homeRoute.configKey }
      )
    );
  }
}

export default validateFrameworkPagePaths;
