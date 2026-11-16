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

import { redactErrorResponse } from '@lowdefy/api';
import { expectedAnswers, isExpectedError } from '@lowdefy/errors';
import { HTTPException } from 'hono/http-exception';

import sentrySdk from '../../lib/server/sentry/sentrySdk.js';

// Hono routes every handler error to the app-level error handler — upstream
// middleware try/catch never sees them (compose catches per dispatch level).
// API routes get the serialized error JSON the old apiWrapper returned;
// page routes get a plain 500.
function createErrorHandler({ basePath = '', logger }) {
  return async function errorHandler(error, c) {
    const path = basePath ? c.req.path.replace(basePath, '') : c.req.path;
    // An expected outcome - the system worked and said no - is one warning line and its
    // status, with no structured error log and no Sentry capture, so probing cannot flood
    // either. isExpectedError decides which errors those are; expectedAnswers (@lowdefy/errors)
    // only gives the answer, the same one on every server.
    if (isExpectedError(error)) {
      // A name expectedErrorNames gains before this table does is still a refusal: a 400.
      const { status, warning, text } = expectedAnswers[error.name] ?? expectedAnswers.UserError;
      const detail = error.name === 'UserError' ? ` - ${error.message}` : '';
      logger.warn(`${warning}: ${c.req.method} ${c.req.path}${detail}`);
      if (path.startsWith('/api/')) {
        return c.json({ name: error.name, message: error.message }, status);
      }
      return c.text(text, status);
    }
    // A route or transport that has already decided its own HTTP answer - hono's
    // HTTPException carries the response to send. The MCP transport refuses an
    // unsupported protocol-version header this way (a 404 with a JSON-RPC body
    // that the client SDK falls back on to negotiate a version both sides
    // know). Not a fault: send its response and log one warning line, no
    // structured error log and no Sentry capture. Turning it into a 500 would
    // hide the status the client acts on.
    if (error instanceof HTTPException) {
      logger.warn(`${error.status} answered by the route: ${c.req.method} ${c.req.path}`);
      return error.getResponse();
    }
    const context = c.get('lowdefyContext');
    if (context) {
      // context.handleError already captures to Sentry (createHandleError ->
      // captureSentryError), so capturing here too would report the fault twice.
      await context.handleError(error);
    } else {
      logger.error(error);
      if (sentrySdk.current) {
        sentrySdk.current.captureException(error);
      }
    }
    if (path.startsWith('/api/')) {
      return c.json(redactErrorResponse(context, error), 500);
    }
    return c.text('Internal Server Error', 500);
  };
}

export default createErrorHandler;
