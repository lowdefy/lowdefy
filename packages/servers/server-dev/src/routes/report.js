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

import { callRequest } from '@lowdefy/api';
import { ConfigError } from '@lowdefy/errors';
import { serializer } from '@lowdefy/helpers';

import buildPageIfNeeded from '../../lib/server/jitPageBuilder.js';
import getPathSegments from '../lib/getPathSegments.js';

// Collect the per-block `report:` options the build leaves on the built page
// JSON. The engine drops these keys during evaluation, so the map is extracted
// here from the raw config and passed to generateReport keyed by blockId. Walk
// every slot's blocks recursively; a block's own children live under its slots.
function collectReportOptions(block, map) {
  for (const slot of Object.values(block?.slots ?? {})) {
    for (const child of slot?.blocks ?? []) {
      if (child.report && child.blockId) {
        map[child.blockId] = child.report;
      }
      collectReportOptions(child, map);
    }
  }
}

// A download filename becomes a quoted Content-Disposition value, so strip the
// characters that would break the header or escape the download directory:
// quotes, backslashes, path separators, and control characters.
function sanitizeFilename(name) {
  return name.replace(/["\\/\r\n\t -]/g, '').trim();
}

async function reportHandler(c) {
  const context = c.get('lowdefyContext');
  const pageId = getPathSegments(c, '/api/report/').join('/');

  // Dev builds pages on demand, so a page that has never been opened has no
  // config artifact yet. Build it first — otherwise downloading a report for a
  // page the user has not visited would 404 (routes/jitPage.js does the same).
  // Build failures surface as thrown errors here, unlike the page route's
  // structured JSON, since there is no download UI to render them into.
  await buildPageIfNeeded({
    pageId,
    buildDirectory: context.buildDirectory,
    configDirectory: context.configDirectory,
  });

  // Existence-masking: an unknown page and a page the session may not view
  // return the same 404, so the route never reveals which pages exist. The
  // authorize check is identical to viewing the page (getPageConfig.js).
  const pageConfig = await context.readConfigFile(`pages/${pageId}.json`);
  if (!pageConfig || !context.authorize(pageConfig)) {
    context.logger.info({ event: 'report_not_found', pageId });
    return c.body('Not found', 404);
  }

  // readConfigFile caches parsed artifacts — deep copy so the headless render
  // never mutates the shared cached config, and drop the auth key the engine
  // has no use for.
  // eslint-disable-next-line no-unused-vars
  const { auth, ...rest } = serializer.copy(pageConfig);

  const reportOptions = {};
  collectReportOptions(rest, reportOptions);

  const { report } = context;

  // Every page request runs through @lowdefy/api callRequest, so it passes the
  // same authorizeRequest gate as an interactive request — a user can never
  // download data from a request they could not call in the browser.
  const reportCallRequest = (args) => callRequest(context, args);

  const lowdefyGlobal = (await context.readConfigFile('global.json')) || {};

  const body = (await c.req.json().catch(() => ({}))) ?? {};
  const { format = 'pdf', filename, urlQuery, input, state } = body;

  try {
    const result = await report.generateReport({
      pageConfig: rest,
      format,
      snapshot: { urlQuery, input, state },
      reportOptions,
      invocation: 'user',
      callRequest: reportCallRequest,
      operators: report.operators,
      jsMap: report.jsMap,
      blockMetas: report.blockMetas,
      registry: report.registry,
      stylesheets: report.stylesheets,
      user: context.session?.user ?? null,
      lowdefyGlobal,
      serverUrl: context.origin,
      publicDir: report.publicDir,
      logger: context.logger,
    });

    const downloadName = sanitizeFilename(filename || result.filename) || result.filename;
    context.logger.info({ event: 'report_generated', pageId, format });
    c.header('Content-Type', result.contentType);
    c.header('Content-Disposition', `attachment; filename="${downloadName}"`);
    return c.body(result.buffer);
  } catch (error) {
    // A timeout freed the semaphore slot but the render never settled; a busy
    // process rejected before starting. ConfigErrors are the caller's fault
    // (bad format, _user on a system render). Everything else is a 500 routed
    // to the app error handler.
    if (/timed out/.test(error.message)) {
      context.logger.error({ event: 'report_timeout', pageId }, error.message);
      return c.body('Report generation timed out', 504);
    }
    if (/busy|too many/i.test(error.message)) {
      context.logger.error({ event: 'report_busy', pageId }, error.message);
      return c.body('Report generation is busy', 503);
    }
    if (error instanceof ConfigError) {
      context.logger.error({ event: 'report_config_error', pageId }, error.message);
      return c.body(error.message, 400);
    }
    throw error;
  }
}

export default reportHandler;
