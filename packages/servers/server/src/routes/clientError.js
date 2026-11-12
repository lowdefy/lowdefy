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

import { type } from '@lowdefy/helpers';
import { logClientError, parseRequestBody } from '@lowdefy/api';

import captureSentryError from '../../lib/server/sentry/captureSentryError.js';
import getRequestSurface from '../lib/getRequestSurface.js';
import getViewOrigins from '../lib/getViewOrigins.js';
import createSameOriginGuard from '../middleware/createSameOriginGuard.js';

// No Origin is allowed: a phone shell's fetch sends none, and refusing it lost
// every native fault. A browser on another site always sends Origin or
// Sec-Fetch-Site on a cross-site POST, so it is still refused.
const guardSameOrigin = createSameOriginGuard({ allowNoOrigin: true });

// An MCP App view runs the app's client on its host's origin, so its faults
// arrive cross-site. They are admitted only from a view's exact origin and
// only with a view session: the origin alone is public knowledge.
function isViewRequest({ c, context }) {
  return !type.isNone(context.viewSession) && getViewOrigins().includes(c.req.header('origin'));
}

async function clientErrorHandler(c) {
  if (c.req.method !== 'POST') {
    // A wrong-method request is client-caused: answer 405 rather than raising a
    // fault that would be logged at error level and answered with a 500.
    return c.json({ error: 'Method not allowed.' }, 405);
  }
  const context = c.get('lowdefyContext');

  if (!isViewRequest({ c, context })) {
    const forbidden = guardSameOrigin(c);
    if (forbidden) {
      return forbidden;
    }
  }

  const body = parseRequestBody({ text: await c.req.text() });
  // Strip received from payload — prod doesn't need it for schema validation
  if (body?.['~e']) {
    delete body['~e'].received;
  }
  // The log line says whether a phone shell ('mobile', with its shell version)
  // or a browser ('web') reported the fault.
  const surface = getRequestSurface(c);
  const surfaceFields =
    surface === 'mobile' ? { surface, shell: c.req.header('x-lowdefy-shell') } : { surface };
  const { error, ...response } = await logClientError(
    { ...context, logger: context.logger.child(surfaceFields) },
    body
  );

  // Capture client error to Sentry (no-op if Sentry not configured)
  captureSentryError({
    error,
    context,
    configLocation: response.source ? { source: response.source, config: response.config } : null,
  });

  return c.json({ success: true });
}

export default clientErrorHandler;
