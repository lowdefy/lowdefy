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

import feedbackStore from '../../lib/docs/feedbackStore.js';
import formatFeedback from '../../lib/docs/formatFeedback.js';

// Polled by a Claude Code Stop hook (a local `curl` from the same machine,
// not a browser page) to pick up developer feedback queued by
// routes/feedback.js. No origin/host check here — unlike feedback.js and
// clientError.js, the caller is a local process, not a browser tab, so
// there is no Origin header to check against; the dev server already only
// binds to localhost.
async function feedbackPendingHandler(c) {
  const consume = c.req.query('consume') === '1';
  const items = consume ? feedbackStore.consumeAll() : feedbackStore.peek();

  return c.json({
    count: items.length,
    items,
    formatted: formatFeedback({ items }),
  });
}

export default feedbackPendingHandler;
