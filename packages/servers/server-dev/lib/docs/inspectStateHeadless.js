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

import { getBrowser, openPage, buildPageUrl } from './getBrowser.js';
import unsettledPageNote from './unsettledPageNote.js';

// Collects a state snapshot from a headless Chromium tab navigated to the
// page's own route. Mirrors Inspector.jsx's buildSnapshot (the live-tab
// equivalent), but window.lowdefy does not expose the app's serializer, so
// the snapshot is round-tripped through JSON.parse(JSON.stringify(...))
// inside the page instead. That strips functions/undefined and turns Dates
// into plain ISO strings — good enough for agent inspection, just not a
// byte-for-byte match of the app's own `~d`-tagged serialization.
async function inspectStateHeadless({ origin, pageId, user, timeout = 15000 }) {
  if (type.isNone(origin) || !type.isString(origin)) {
    return {
      error: `inspectStateHeadless requires an "origin" string. Received ${JSON.stringify(
        origin
      )}.`,
    };
  }
  if (type.isNone(pageId) || !type.isString(pageId)) {
    return {
      error: `inspectStateHeadless requires a "pageId" string. Received ${JSON.stringify(pageId)}.`,
    };
  }

  let browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    return {
      error: `No Chromium available. Run: npx playwright install chromium (${error.message})`,
    };
  }

  const url = buildPageUrl({ origin, pageId });

  let context;
  try {
    const opened = await openPage({ browser, origin, pageId, user, timeout });
    context = opened.context;
    const snapshot = await opened.page.evaluate((id) => {
      const lowdefy = window.lowdefy;
      const pageContext = lowdefy?.contexts?.[`page:${id}`];
      if (!pageContext) {
        return { error: `No live context for page "${id}".` };
      }
      return JSON.parse(
        JSON.stringify({
          pageId: id,
          state: pageContext.state,
          requests: pageContext.requests,
          eventLog: (pageContext.eventLog ?? []).slice(-50),
          global: lowdefy.lowdefyGlobal,
          user: lowdefy.user,
          input: lowdefy.inputs?.[`page:${id}`],
          urlQuery: window.location.search,
        })
      );
    }, pageId);
    if (!opened.ready) {
      return { ...snapshot, ready: false, note: unsettledPageNote({ timeout }) };
    }
    return snapshot;
  } catch (error) {
    return { error: `Failed to inspect state at "${url}": ${error.message}` };
  } finally {
    if (context) {
      await context.close();
    }
  }
}

export default inspectStateHeadless;
