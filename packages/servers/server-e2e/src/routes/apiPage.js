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

import { getPageConfig } from '@lowdefy/api';

import lowdefyConfig from '../../lib/build/config.js';
import getRequestPath from '../lib/getRequestPath.js';

const basePath = lowdefyConfig.basePath ?? '';

// Page config as JSON for client-side SPA navigation, by the page's path (for a
// page without a path, its id). The first page load is served embedded in the
// HTML; subsequent navigations fetch from here.
async function apiPageHandler(c) {
  const context = c.get('lowdefyContext');
  const { path, matchedPath } = getRequestPath({ c, basePath, prefix: '/api/page/' });
  // The client forwards its current query string on the fetch so Dynamic block
  // resolution sees the same urlQuery as an initial HTML load.
  const result = await getPageConfig(context, { path, urlQuery: c.req.query() });
  const { pageId, pathParams } = result;
  if (result.status !== 'ok') {
    context.logger.info({ event: 'api_page_not_found', pageId, path });
    return c.json({ pageConfig: null }, 404);
  }
  context.logger.info({ event: 'api_page_view', pageId, path });
  return c.json({ pageId, pathParams, matchedPath, pageConfig: result.pageConfig });
}

export default apiPageHandler;
