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

import { logFeedbackReport } from '@lowdefy/api';

import createSameOriginGuard from '../middleware/createSameOriginGuard.js';
import lowdefyConfig from '../../lib/build/config.js';

const guardSameOrigin = createSameOriginGuard();

// An end user's "this is broken" report. Unlike the journey beacon this is a
// signed write: the app must have turned feedback on, and the caller must be
// authenticated (and hold one of config.feedback.roles, when the app named
// any). Same-origin only, like /api/journey.
async function feedbackHandler(c) {
  if (c.req.method !== 'POST') {
    return c.json({ error: 'Method not allowed.' }, 405);
  }

  const forbidden = guardSameOrigin(c);
  if (forbidden) {
    return forbidden;
  }

  const context = c.get('lowdefyContext');
  const result = logFeedbackReport(context, {
    feedback: lowdefyConfig.feedback,
    report: await c.req.json(),
  });

  if (result.status === 'invalid') {
    return c.json({ error: result.message }, 400);
  }
  if (result.status !== 'ok') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  return c.body(null, 204);
}

export default feedbackHandler;
