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

import { getPageConfig, getRootConfig } from '@lowdefy/api';
import { type } from '@lowdefy/helpers';

import appJson from '../../lib/build/app.js';
import lowdefyConfig from '../../lib/build/config.js';
import themeConfig from '../../lib/build/theme.js';
import getAssets from './getAssets.js';
import getHomePath from './getHomePath.js';
import template from './template.js';

const basePath = lowdefyConfig.basePath ?? '';

// Renders the page a request path matches. path (basePath and the leading "/"
// removed, still encoded) is empty for the app root, which serves the home
// page: the configured homePageId, else a redirect to the first menu link the
// user may see.
async function renderPage(c, { path, matchedPath, status = 200 }) {
  const context = c.get('lowdefyContext');
  const { logger, user } = context;

  const rootConfig = await getRootConfig(context);

  let pagePath = path;
  if (path === '') {
    const { home } = rootConfig;
    pagePath = await getHomePath({ context, home });
    if (home.configured === false) {
      logger.info({ event: 'redirect_to_homepage', pageId: home.pageId, path: pagePath });
      return c.redirect(`${basePath}/${pagePath}`, 302);
    }
  }

  const result = await getPageConfig(context, {
    path: pagePath,
    urlQuery: c.req.query(),
  });
  const { pageId, pathParams } = result;

  if (result.status !== 'ok') {
    if (pagePath === '404') {
      // No 404 page in the build — return a plain 404 rather than redirecting in a loop.
      return c.text('Page not found.', 404);
    }
    logger.info({ event: 'redirect_page_not_found', pageId, path: pagePath });
    return c.redirect(`${basePath}/404`, 302);
  }

  const { pageConfig } = result;

  logger.info({ event: 'page_view', pageId, path: pagePath });

  const html = template({
    appendBody: appJson.html?.appendBody ?? '',
    appendHead: appJson.html?.appendHead ?? '',
    assets: getAssets(),
    basePath,
    config: {
      basePath,
      matchedPath,
      pageConfig,
      pageId,
      pathParams,
      rootConfig,
      user: user ?? null,
    },
    themeConfig,
    // A title written as an operator is evaluated on the client, which replaces this one.
    title: type.isString(pageConfig.properties?.title) ? pageConfig.properties.title : pageId,
  });

  return c.html(html, status);
}

export default renderPage;
