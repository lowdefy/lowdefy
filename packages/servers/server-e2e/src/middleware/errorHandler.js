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
import { HTTPException } from 'hono/http-exception';

// Hono routes every handler error to the app-level error handler — upstream
// middleware try/catch never sees them (compose catches per dispatch level).
// API routes get the serialized error JSON the old apiWrapper returned;
// page routes get a plain 500.
function createErrorHandler({ basePath = '', logger }) {
  return async function errorHandler(error, c) {
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
      await context.handleError(error);
    } else {
      logger.error(error);
    }
    const path = basePath ? c.req.path.replace(basePath, '') : c.req.path;
    if (path.startsWith('/api/')) {
      return c.json(redactErrorResponse(context, error), 500);
    }
    return c.text('Internal Server Error', 500);
  };
}

export default createErrorHandler;
