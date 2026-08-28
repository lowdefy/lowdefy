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

import fs from 'node:fs';
import path from 'node:path';

import drawAnnotationsSvg from '../../client/feedback/drawAnnotationsSvg.js';
import { getBrowser, openPage } from './getBrowser.js';

// Renders the page headless at the batch's recorded viewport/scroll, injects
// the developer's drawn shapes and element outlines as an SVG layer inside
// the page, screenshots the composite, and saves it under the config dir's
// .lowdefy/annotations/ (gitignored). The saved path goes into the formatted
// feedback text so an agent can read the image. Never throws — returns
// { path } or { error }.
async function captureAnnotatedScreenshot({ origin, batch, fileName }) {
  let browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    return { error: `No Chromium available for the annotated screenshot (${error.message}).` };
  }

  const viewport = batch.viewport ?? {};
  const width = viewport.width || 1280;
  const height = viewport.height || 800;
  const urlQuery = batch.urlQuery && batch.urlQuery !== '?' ? batch.urlQuery : '';

  let context;
  try {
    const opened = await openPage({
      browser,
      origin,
      pageId: `${batch.pageId}${urlQuery}`,
      width,
      height,
    });
    context = opened.context;
    const { page } = opened;

    if (viewport.scrollX || viewport.scrollY) {
      await page.evaluate(
        ([x, y]) => window.scrollTo(x, y),
        [viewport.scrollX ?? 0, viewport.scrollY ?? 0]
      );
      await page.waitForTimeout(200);
    }

    // Shapes and element rects are viewport-relative at the recorded scroll
    // offset — after scrolling to the same offset they overlay 1:1. The
    // compositor is shared with the in-tab capture (drawAnnotationsSvg is
    // self-contained, so Playwright can serialize it into the page).
    await page.evaluate(drawAnnotationsSvg, batch.annotations ?? []);
    await page.waitForTimeout(150);

    const buffer = await page.screenshot({ type: 'png' });

    const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();
    const dir = path.join(configDirectory, '.lowdefy', 'annotations');
    fs.mkdirSync(dir, { recursive: true });
    const name =
      fileName ?? `${batch.pageId}-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    fs.writeFileSync(path.join(dir, name), buffer);

    return { path: path.join('.lowdefy', 'annotations', name) };
  } catch (error) {
    return { error: `Failed to capture annotated screenshot: ${error.message}` };
  } finally {
    if (context) {
      await context.close();
    }
  }
}

export default captureAnnotatedScreenshot;
