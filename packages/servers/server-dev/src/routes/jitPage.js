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
import buildPageIfNeeded from '../../lib/server/jitPageBuilder.js';
import getPathSegments from '../lib/getPathSegments.js';
import lowdefyConfig from '../../lib/build/config.js';

const basePath = lowdefyConfig.basePath ?? '';

// JIT page build + config response. The response shapes are a frozen contract
// with the dev client:
//   200 { installing: true, packages }  — plugin install in progress, client polls
//   500 { buildError: true, errors, message, source }  — build failed
//   401 { redirect }  — logged-out navigation to a protected page
//   404 'Page not found.'
//   200 pageConfig (+ _warnings)
async function jitPageHandler(c) {
  const context = c.get('lowdefyContext');
  const pageId = getPathSegments(c, '/api/page/').join('/');

  let buildResult;
  try {
    buildResult = await buildPageIfNeeded({
      pageId,
      buildDirectory: context.buildDirectory,
      configDirectory: context.configDirectory,
    });
  } catch (error) {
    const rawErrors = error.buildErrors ?? [error];
    const errors = [];
    for (const err of rawErrors) {
      await context.handleError(err);
      errors.push({
        type: err.name ?? 'Error',
        message: err.message,
        source: err.source ?? null,
        stack: err.stack ?? null,
      });
    }
    return c.json(
      {
        buildError: true,
        errors,
        // Keep top-level message/source for backward compatibility
        message: error.message,
        source: error.source ?? null,
      },
      500
    );
  }

  if (buildResult && buildResult.installing) {
    return c.json({
      installing: true,
      packages: buildResult.packages,
    });
  }

  const result = await getPageConfig(context, { pageId });
  if (result.status === 'unauthenticated') {
    // The client follows this redirect with a full page load, so the login
    // page can return to the requested page after sign-in.
    const callbackUrl = `${basePath}/${pageId}`;
    return c.json(
      {
        redirect: `${basePath}${authJson.authPages.signIn}?callbackUrl=${encodeURIComponent(
          callbackUrl
        )}`,
      },
      401
    );
  }
  if (result.status !== 'ok') {
    return c.text('Page not found.', 404);
  }
  const pageConfig = result.pageConfig;
  if (buildResult?.warnings?.length > 0) {
    pageConfig._warnings = buildResult.warnings;
  }
  return c.json(pageConfig);
}

export default jitPageHandler;
