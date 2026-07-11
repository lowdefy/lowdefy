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
import formatFeedback from '../../lib/docs/formatFeedback.js';

// Receives annotation batches from the dev browser overlay (a developer
// draws on a live page and comments), enriches each annotation with its
// yaml file:line via findConfig, and returns the formatted agent-readable
// text. The overlay copies that text to the clipboard — the developer
// pastes it into whichever agent session they choose, which is also what
// makes delivery unambiguous when several sessions share one dev server.
// Same-origin check cloned from routes/clientError.js: only a page served
// by this dev server (not an arbitrary site) should be able to use it.
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

  return c.json({ ok: true, formatted: formatFeedback({ items: [enriched] }) });
}

export default feedbackHandler;
