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
import createLogger from '../../lib/server/log/createLogger.js';
import createSameOriginGuard from '../middleware/createSameOriginGuard.js';

const logger = createLogger({ server: 'lowdefy-dev-feedback' });
const guardSameOrigin = createSameOriginGuard();

// Receives annotation batches from the dev browser overlay (a developer
// draws on a live page and comments), enriches each annotation with its
// yaml file:line via findConfig, and returns the formatted agent-readable
// text. The overlay copies that text to the clipboard — the developer
// pastes it into whichever agent session they choose, which is also what
// makes delivery unambiguous when several sessions share one dev server.
// The same-origin guard the browser POST routes share: only a page served by
// this dev server (not an arbitrary site) should be able to use it.
async function feedbackHandler(c) {
  const forbidden = guardSameOrigin(c);
  if (forbidden) {
    return forbidden;
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

  // The tab screenshot rides in as a multi-MB data URL — lift it off the
  // batch before enrichment so it never reaches the formatted text or the
  // headless capture path.
  const tabScreenshot = batch.screenshot;
  delete batch.screenshot;
  let enriched = await enrichFeedback({ batch });
  delete enriched.screenshot;

  // Default on — the overlay sends includeScreenshot: false when the
  // developer unticks it.
  if (batch.includeScreenshot !== false) {
    const fileName = `${batch.pageId}-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    if (typeof tabScreenshot === 'string') {
      // Preferred path: the overlay captured the developer's actual tab —
      // theme, loaded data, exact pixels — with annotations already drawn.
      const { default: saveAnnotatedScreenshot } = await import(
        '../../lib/docs/saveAnnotatedScreenshot.js'
      );
      const result = saveAnnotatedScreenshot({ dataUrl: tabScreenshot, fileName });
      if (result.path) {
        enriched = { ...enriched, screenshotPath: result.path };
      } else {
        logger.warn(result.error);
      }
    } else {
      // Fallback: re-render the page headless (batches from agents or older
      // clients, or when the in-tab capture failed). The response must NOT
      // wait for this capture: the overlay writes the clipboard when this
      // returns, and Chrome's transient user-activation (required for
      // clipboard writes) expires within ~5s — a headless browser launch can
      // take longer. So the path is pre-assigned, the formatted text returns
      // immediately, and the PNG lands on disk a moment later — well before
      // a human pastes it anywhere.
      // Deferred import: the capture module pulls in the browser singleton,
      // which reads build artifacts at import time — only load it when a
      // screenshot is actually wanted.
      const { default: captureAnnotatedScreenshot } = await import(
        '../../lib/docs/captureAnnotatedScreenshot.js'
      );
      const serverOrigin = new URL(c.req.url).origin;
      enriched = { ...enriched, screenshotPath: `.lowdefy/annotations/${fileName}` };
      captureAnnotatedScreenshot({ origin: serverOrigin, batch: enriched, fileName }).then(
        (result) => {
          if (result.error) {
            logger.warn(result.error);
          }
        }
      );
    }
  }

  return c.json({ ok: true, formatted: formatFeedback({ items: [enriched] }) });
}

export default feedbackHandler;
