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

import authJson from '../../lib/build/auth.js';
import lowdefyConfig from '../../lib/build/config.js';
import getPathSegments from '../lib/getPathSegments.js';

const basePath = lowdefyConfig.basePath ?? '';

// Page config as JSON for client-side SPA navigation. The first page load is
// served embedded in the HTML; subsequent navigations fetch from here.
async function apiPageHandler(c) {
  const context = c.get('lowdefyContext');
  const pageId = getPathSegments(c, '/api/page/').join('/');
  // The client forwards its current query string on the fetch so Dynamic block
  // resolution sees the same urlQuery as an initial HTML load.
  const result = await getPageConfig(context, { pageId, urlQuery: c.req.query() });
  if (result.status === 'unauthenticated') {
    // The client follows this redirect with a full page load, so the login
    // page can return to the requested page after sign-in.
    const callbackUrl = `${basePath}/${pageId}`;
    context.logger.info({ event: 'api_page_unauthenticated', pageId });
    return c.json(
      {
        redirect: `${basePath}${authJson.authPages.signIn}?callbackUrl=${encodeURIComponent(
          callbackUrl
        )}`,
      },
      401
    );
  }
  if (result.status === 'enrol_required') {
    // 403, not the 401 the signed-out branch above uses: a 401 is the client's
    // dead-session signal and would bounce the user to sign-in, which is the loop
    // the enrolment gate exists to avoid.
    const callbackUrl = `${basePath}/${pageId}`;
    context.logger.info({ event: 'api_page_enrol_required', pageId });
    return c.json(
      {
        redirect: `${basePath}${authJson.authPages.twoFactorEnrol}?callbackUrl=${encodeURIComponent(
          callbackUrl
        )}`,
      },
      403
    );
  }
  if (result.status !== 'ok') {
    context.logger.info({ event: 'api_page_not_found', pageId });
    return c.json({ pageConfig: null }, 404);
  }
  context.logger.info({ event: 'api_page_view', pageId });
  return c.json({ pageConfig: result.pageConfig });
}

export default apiPageHandler;
