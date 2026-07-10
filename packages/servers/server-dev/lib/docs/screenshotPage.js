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

// screenshotPage lets an agent visually verify a page rendered by the
// running dev server.
async function screenshotPage({
  origin,
  pageId,
  fullPage = false,
  width = 1280,
  height = 800,
  timeout = 15000,
}) {
  if (type.isNone(origin) || !type.isString(origin)) {
    return { error: `screenshotPage requires an "origin" string. Received ${JSON.stringify(origin)}.` };
  }
  if (type.isNone(pageId) || !type.isString(pageId)) {
    return { error: `screenshotPage requires a "pageId" string. Received ${JSON.stringify(pageId)}.` };
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
    const opened = await openPage({ browser, origin, pageId, width, height, timeout });
    context = opened.context;
    // Let post-load rendering (fonts, transitions, client-side state) settle.
    await opened.page.waitForTimeout(300);
    const buffer = await opened.page.screenshot({ type: 'png', fullPage });
    return { data: buffer.toString('base64'), mimeType: 'image/png' };
  } catch (error) {
    return { error: `Failed to screenshot "${url}": ${error.message}` };
  } finally {
    if (context) {
      await context.close();
    }
  }
}

export default screenshotPage;
