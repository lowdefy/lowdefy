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

import getPathSegments from '../lib/getPathSegments.js';

// Page config as JSON for client-side SPA navigation. The first page load is
// served embedded in the HTML; subsequent navigations fetch from here.
async function apiPageHandler(c) {
  const context = c.get('lowdefyContext');
  const pageId = getPathSegments(c, '/api/page/').join('/');
  const result = await getPageConfig(context, { pageId });
  if (result.status !== 'ok') {
    context.logger.info({ event: 'api_page_not_found', pageId });
    return c.json({ pageConfig: null }, 404);
  }
  context.logger.info({ event: 'api_page_view', pageId });
  return c.json({ pageConfig: result.pageConfig });
}

export default apiPageHandler;
