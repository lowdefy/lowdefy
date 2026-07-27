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

import { renderReport } from '@lowdefy/api';
import { ConfigError } from '@lowdefy/errors';

import buildPageIfNeeded from '../../lib/server/jitPageBuilder.js';
import getPathSegments from '../lib/getPathSegments.js';

// A download filename becomes a quoted Content-Disposition value, so strip the
// characters that would break the header or escape the download directory:
// quotes, backslashes, path separators, and control characters. Stripping
// control bytes is the point here, hence the rule exemption.
// eslint-disable-next-line no-control-regex
const UNSAFE_FILENAME_CHARS = /["\\/\x00-\x1f]/g;

function sanitizeFilename(name) {
  return name.replace(UNSAFE_FILENAME_CHARS, '').trim();
}

async function reportHandler(c) {
  const context = c.get('lowdefyContext');
  const pageId = getPathSegments(c, '/api/report/').join('/');

  const body = (await c.req.json().catch(() => ({}))) ?? {};
  const { format = 'pdf', filename, urlQuery, input, state } = body;

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

  try {
    // renderReport (@lowdefy/api) authorizes the page exactly as viewing it does
    // and returns null for both an unknown page and one this session may not
    // view, so the route never reveals which pages exist.
    const result = await renderReport(context, {
      pageId,
      format,
      snapshot: { urlQuery, input, state },
      invocation: 'user',
    });

    if (!result) {
      context.logger.info({ event: 'report_not_found', pageId });
      return c.body('Not found', 404);
    }

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
