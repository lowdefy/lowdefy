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

import appJson from '../../lib/build/app.js';
import authJson from '../../lib/build/auth.js';
import lowdefyConfig from '../../lib/build/config.js';
import themeConfig from '../../lib/build/theme.js';
import getAssets from './getAssets.js';
import template from './template.js';

const basePath = lowdefyConfig.basePath ?? '';

// Replaces pages/[[...pageId]].js getServerSideProps and pages/404.js
// getStaticProps. The home redirect logic lives here, not at the route level.
async function renderPage(c, { pageId, status = 200 }) {
  const context = c.get('lowdefyContext');
  const { logger, user } = context;

  let resolvedPageId = pageId;
  const rootConfig = await getRootConfig(context);

  if (!resolvedPageId) {
    const { home } = rootConfig;
    if (home.configured === false) {
      logger.info({ event: 'redirect_to_homepage', pageId: home.pageId });
      return c.redirect(`${basePath}/${home.pageId}`, 302);
    }
    resolvedPageId = home.pageId;
  }

  const result = await getPageConfig(context, {
    pageId: resolvedPageId,
    urlQuery: c.req.query(),
  });

  // A logged-out human gets a login screen with a callbackUrl back to the
  // requested page; not-found and wrong-roles both stay opaque (/404), so
  // page navigation never reveals who may access a page.
  if (result.status === 'unauthenticated') {
    const url = new URL(c.req.url);
    const callbackUrl = `${url.pathname}${url.search}`;
    logger.info({ event: 'redirect_unauthenticated', pageId: resolvedPageId });
    return c.redirect(
      `${basePath}${authJson.authPages.signIn}?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      302
    );
  }

  // An authorised caller who has not enrolled a second factor under
  // auth.twoFactor.required. The callbackUrl brings them back to the page they
  // asked for once they enrol. Without this branch they would fall through to the
  // /404 redirect below on every page - fail-closed, and indistinguishable from a
  // broken app.
  if (result.status === 'enrol_required') {
    const url = new URL(c.req.url);
    const callbackUrl = `${url.pathname}${url.search}`;
    logger.info({ event: 'redirect_two_factor_enrol', pageId: resolvedPageId });
    return c.redirect(
      `${basePath}${authJson.authPages.twoFactorEnrol}?callbackUrl=${encodeURIComponent(
        callbackUrl
      )}`,
      302
    );
  }

  if (result.status !== 'ok') {
    if (resolvedPageId === '404') {
      // No 404 page in the build — return a plain 404 rather than redirecting in a loop.
      return c.text('Page not found.', 404);
    }
    logger.info({ event: 'redirect_page_not_found', pageId: resolvedPageId });
    return c.redirect(`${basePath}/404`, 302);
  }

  const { pageConfig } = result;

  logger.info({ event: 'page_view', pageId: resolvedPageId });

  const html = template({
    appendBody: appJson.html?.appendBody ?? '',
    appendHead: appJson.html?.appendHead ?? '',
    assets: getAssets(),
    basePath,
    config: {
      basePath,
      pageConfig,
      rootConfig,
      sentryDsn: process.env.SENTRY_DSN ?? null,
      user: user ?? null,
    },
    pageId: resolvedPageId,
    themeConfig,
    title: pageConfig.properties?.title ?? resolvedPageId,
  });

  return c.html(html, status);
}

export default renderPage;
