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

import { toPng } from 'html-to-image';

import drawAnnotationsSvg from './drawAnnotationsSvg.js';
import pinResponsiveImages from './pinResponsiveImages.js';

// Chrome caps canvas dimensions well above this, but rasterizing a very long
// page at retina density burns memory for no feedback value — drop to 1x
// instead of failing.
const MAX_CANVAS_DIMENSION = 16000;

function resolveBackgroundColor() {
  try {
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent') {
      return bodyBg;
    }
    const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
    if (htmlBg && htmlBg !== 'rgba(0, 0, 0, 0)' && htmlBg !== 'transparent') {
      return htmlBg;
    }
  } catch {
    // Fall through to the default.
  }
  return '#ffffff';
}

// Rasterizes the developer's actual tab — theme, loaded data, exact pixels —
// with the batch's annotations drawn on top, and returns a PNG data URL the
// batch POSTs to the dev server to save. This replaces re-rendering the page
// headless, which diverged from what the developer was looking at (light
// theme, un-settled requests, no client-only state). Returns null on any
// failure so the server can fall back to the headless capture.
async function captureTabScreenshot({ annotations }) {
  let restoreImages = () => {};
  try {
    restoreImages = pinResponsiveImages();
    drawAnnotationsSvg(annotations ?? []);
    const pixelRatio =
      Math.max(document.documentElement.scrollWidth, document.documentElement.scrollHeight) *
        (window.devicePixelRatio || 1) >
      MAX_CANVAS_DIMENSION
        ? 1
        : window.devicePixelRatio || 1;
    const dataUrl = await toPng(document.documentElement, {
      // Keep everything except the overlay's own UI (panels, tray, chips).
      // The annotation SVG lives outside the overlay root, so it stays in.
      filter: (node) =>
        !(node instanceof Element && node.hasAttribute('data-lowdefy-feedback')),
      pixelRatio,
      backgroundColor: resolveBackgroundColor(),
    });
    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/png')) {
      return dataUrl;
    }
    return null;
  } catch {
    return null;
  } finally {
    try {
      restoreImages();
      document.getElementById('lowdefy-feedback-annotations-svg')?.remove();
    } catch {
      // Never let cleanup break the send flow.
    }
  }
}

export default captureTabScreenshot;
