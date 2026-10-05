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

import { getPageConfig, matchPagePath } from '@lowdefy/api';

import authJson from '../../lib/build/auth.js';
import { buildPageWithContext, getPageJitEnrichment } from '../../lib/server/jitPageBuilder.js';
import getBuildId from '../../lib/docs/getBuildId.js';
import getRequestPath from '../lib/getRequestPath.js';
import lowdefyConfig from '../../lib/build/config.js';
import servedBuilds from '../../lib/server/recording/servedBuilds.js';

const basePath = lowdefyConfig.basePath ?? '';

// JIT page build + config response. The response shapes are a frozen contract
// with the dev client:
//   200 { installing: true, packages }  — plugin install in progress, client polls
//   500 { buildError: true, errors, message, source }  — build failed
//   401 { redirect }  — logged-out navigation to a protected page
//   403 { redirect }  — authorised but second factor not yet enrolled
//   404 'Page not found.'
//   200 { pageId, pathParams, matchedPath, pageConfig } (pageConfig + _buildId,
//       + _warnings, + _jsEntries module text, + _dynamicIcons data)
//
// The request path is matched against the skeleton build's route table, and
// the matched page is built before getPageConfig reads its file.
async function jitPageHandler(c) {
  const context = c.get('lowdefyContext');
  const { path, matchedPath } = getRequestPath({ c, basePath, prefix: '/api/page/' });
  // The callbackUrl of the sign-in and enrolment redirects: the requested page,
  // query included.
  const callbackUrl = `${basePath}/${path}${new URL(c.req.url).search}`;
  const match = matchPagePath({ routes: await context.readConfigFile('routes.json'), path });

  let buildResult;
  let buildContext;
  if (match !== null) {
    try {
      ({ result: buildResult, buildContext } = await buildPageWithContext({
        pageId: match.pageId,
        buildDirectory: context.buildDirectory,
        configDirectory: context.configDirectory,
      }));
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
  }

  if (buildResult && buildResult.installing) {
    return c.json({
      installing: true,
      packages: buildResult.packages,
    });
  }

  const result = await getPageConfig(context, { path, urlQuery: c.req.query() });
  if (result.status === 'unauthenticated') {
    // The client follows this redirect with a full page load, so the login
    // page can return to the requested page after sign-in.
    context.logger.debug(
      `Page config request for "/${path}" resolved unauthenticated - returning a sign-in redirect.`
    );
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
    context.logger.debug(
      `Page config request for "/${path}" resolved enrol_required - returning a two-factor enrolment redirect.`
    );
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
    return c.text('Page not found.', 404);
  }
  const pageConfig = result.pageConfig;
  // The build this config was served under. The dev recorder stamps it on each
  // record, and the recording route trusts only a build it finds in
  // servedBuilds.
  pageConfig._buildId = getBuildId();
  servedBuilds.add(pageConfig._buildId);
  if (buildResult?.warnings?.length > 0) {
    pageConfig._warnings = buildResult.warnings;
  }
  // Fold this page's JIT-discovered _js entries and dynamic icons into the
  // response the client already awaits, so first paint has everything it needs
  // without the two secondary fetches that stalled in Vite's transform window.
  // Read from the context the page was built on: another request can discard
  // it while getPageConfig runs.
  const { jsEntries, dynamicIcons } = getPageJitEnrichment({ pageConfig, buildContext });
  if (jsEntries) pageConfig._jsEntries = jsEntries;
  if (dynamicIcons) pageConfig._dynamicIcons = dynamicIcons;
  return c.json({
    pageId: result.pageId,
    pathParams: result.pathParams,
    matchedPath,
    pageConfig,
  });
}

export default jitPageHandler;
