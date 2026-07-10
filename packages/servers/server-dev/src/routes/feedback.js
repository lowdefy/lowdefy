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

import enrichFeedback from '../../lib/docs/enrichFeedback.js';
import feedbackStore from '../../lib/docs/feedbackStore.js';

// Receives annotation batches from the dev browser overlay (a developer
// draws on a live page and comments — see the batch shape this validates
// below) and queues them for Claude Code to pick up via
// GET /lowdefy-docs/feedback-pending. Same-origin check cloned from
// routes/clientError.js: only a page served by this dev server (not an
// arbitrary site) should be able to post feedback into the agent loop.
async function feedbackHandler(c) {
  if (c.req.method !== 'POST') {
    throw new Error('Only POST requests are supported.');
  }

  const origin = c.req.header('origin');
  if (!origin) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  try {
    if (new URL(origin).host !== c.req.header('host')) {
      return c.json({ error: 'Forbidden' }, 403);
    }
  } catch {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const batch = await c.req.json();
  if (!Array.isArray(batch?.annotations)) {
    return c.json(
      {
        error:
          'Feedback batch requires an "annotations" array. See GET /lowdefy-docs for the ' +
          'feedback batch shape.',
      },
      400
    );
  }

  const enriched = await enrichFeedback({ batch });
  feedbackStore.push(enriched);

  return c.json({ ok: true, queued: feedbackStore.count() });
}

export default feedbackHandler;
