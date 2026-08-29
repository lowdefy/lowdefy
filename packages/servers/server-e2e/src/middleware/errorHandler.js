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

// Hono routes every handler error to the app-level error handler — upstream
// middleware try/catch never sees them. API routes get the serialized error
// JSON the old apiWrapper returned; page routes get a plain 500.
function createErrorHandler({ basePath = '', logger }) {
  return async function errorHandler(error, c) {
    const path = basePath ? c.req.path.replace(basePath, '') : c.req.path;
    // Unauthenticated requests to protected endpoints are expected traffic -
    // one warning line and a 401, skipping the structured error log so
    // probing cannot flood it. Keys strictly on the error name; the 500 path
    // below is untouched.
    if (error.name === 'AuthenticationError') {
      logger.warn(`Unauthenticated request: ${c.req.method} ${c.req.path}`);
      if (path.startsWith('/api/')) {
        return c.json({ name: error.name, message: error.message }, 401);
      }
      return c.text('Unauthorized', 401);
    }
    // An authenticated caller whose roles do not permit the resource. Expected
    // traffic, not a fault: one warning line, no structured error log and no
    // Sentry capture.
    if (error.name === 'AuthorizationError') {
      logger.warn(`Forbidden: ${c.req.method} ${c.req.path}`);
      if (path.startsWith('/api/')) {
        return c.json({ name: error.name, message: error.message }, 403);
      }
      return c.text('Forbidden', 403);
    }
    // An authorized caller who has not enrolled a second factor under
    // auth.twoFactor.required. 403, not 401 - a 401 reads to the client as a dead
    // session and bounces the user to sign-in, which is the loop the gate exists to
    // avoid. Expected traffic under required: true, so one warning line and no
    // Sentry capture, exactly as for AuthenticationError.
    if (error.name === 'TwoFactorEnrolmentRequiredError') {
      logger.warn(`Two-factor enrolment required: ${c.req.method} ${c.req.path}`);
      if (path.startsWith('/api/')) {
        return c.json({ name: error.name, message: error.message }, 403);
      }
      return c.text('Two-factor enrolment required', 403);
    }
    const context = c.get('lowdefyContext');
    if (context) {
      await context.handleError(error);
    } else {
      logger.error(error);
    }
    if (path.startsWith('/api/')) {
      return c.json(redactErrorResponse(context, error), 500);
    }
    return c.text('Internal Server Error', 500);
  };
}

export default createErrorHandler;
