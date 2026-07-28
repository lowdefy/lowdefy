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
import { ReportBusyError, ReportTimeoutError, reportContentDisposition } from '@lowdefy/reports';

import getPathSegments from '../lib/getPathSegments.js';

async function reportHandler(c) {
  if (c.req.method !== 'POST') {
    throw new Error('Only POST requests are supported.');
  }
  const context = c.get('lowdefyContext');
  const pageId = getPathSegments(c, '/api/report/').join('/');

  const body = (await c.req.json().catch(() => ({}))) ?? {};
  const { format = 'pdf', filename, urlQuery, input, state } = body;

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

    context.logger.info({ event: 'report_generated', pageId, format });
    c.header('Content-Type', result.contentType);
    c.header(
      'Content-Disposition',
      reportContentDisposition({ requested: filename, fallback: result.filename })
    );
    return c.body(result.buffer);
  } catch (error) {
    // Map by class, never by message text: a report's own timeout and an
    // upstream data source's read the same in prose, and half the caller's
    // mistakes name neither. A timeout means the render exceeded its deadline
    // and was aborted; busy means the queue was full before it started;
    // ConfigErrors are the caller's fault (bad format, xlsx for a page with no
    // grids, _user on a system render). Everything else is a 500 routed to the
    // app error handler.
    if (error instanceof ReportTimeoutError) {
      context.logger.error({ event: 'report_timeout', pageId }, error.message);
      return c.body('Report generation timed out', 504);
    }
    if (error instanceof ReportBusyError) {
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
