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
    // offset — after scrolling to the same offset they overlay 1:1.
    await page.evaluate((annotations) => {
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute(
        'style',
        'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483000;'
      );
      const defs = document.createElementNS(NS, 'defs');
      const marker = document.createElementNS(NS, 'marker');
      marker.setAttribute('id', 'ldf-annotation-arrowhead');
      marker.setAttribute('markerWidth', '10');
      marker.setAttribute('markerHeight', '8');
      marker.setAttribute('refX', '9');
      marker.setAttribute('refY', '4');
      marker.setAttribute('orient', 'auto');
      const head = document.createElementNS(NS, 'polygon');
      head.setAttribute('points', '0 0, 10 4, 0 8');
      head.setAttribute('fill', '#ff4785');
      marker.appendChild(head);
      defs.appendChild(marker);
      svg.appendChild(defs);

      const stroke = '#ff4785';
      annotations.forEach((annotation, index) => {
        const rect = annotation.geometry?.elementRect;
        if (rect) {
          const outline = document.createElementNS(NS, 'rect');
          outline.setAttribute('x', rect.x);
          outline.setAttribute('y', rect.y);
          outline.setAttribute('width', rect.width);
          outline.setAttribute('height', rect.height);
          outline.setAttribute('fill', 'rgba(255,71,133,0.08)');
          outline.setAttribute('stroke', stroke);
          outline.setAttribute('stroke-width', '2');
          svg.appendChild(outline);
          const label = document.createElementNS(NS, 'text');
          label.setAttribute('x', rect.x);
          label.setAttribute('y', Math.max(12, rect.y - 6));
          label.setAttribute('fill', stroke);
          label.setAttribute('font-size', '12');
          label.setAttribute('font-family', 'system-ui, sans-serif');
          label.setAttribute('font-weight', '600');
          label.textContent = `${index + 1}`;
          svg.appendChild(label);
        }
        (annotation.geometry?.shapes ?? []).forEach((shape) => {
          if (shape.type === 'rect' && shape.points?.length >= 2) {
            const [a, b] = shape.points;
            const el = document.createElementNS(NS, 'rect');
            el.setAttribute('x', Math.min(a.x, b.x));
            el.setAttribute('y', Math.min(a.y, b.y));
            el.setAttribute('width', Math.abs(b.x - a.x));
            el.setAttribute('height', Math.abs(b.y - a.y));
            el.setAttribute('fill', 'rgba(255,71,133,0.08)');
            el.setAttribute('stroke', stroke);
            el.setAttribute('stroke-width', '2.5');
            svg.appendChild(el);
          }
          if (shape.type === 'arrow' && shape.points?.length >= 2) {
            const [tail, headPoint] = shape.points;
            const el = document.createElementNS(NS, 'line');
            el.setAttribute('x1', tail.x);
            el.setAttribute('y1', tail.y);
            el.setAttribute('x2', headPoint.x);
            el.setAttribute('y2', headPoint.y);
            el.setAttribute('stroke', stroke);
            el.setAttribute('stroke-width', '2.5');
            el.setAttribute('marker-end', 'url(#ldf-annotation-arrowhead)');
            svg.appendChild(el);
          }
          if (shape.type === 'freehand' && shape.points?.length >= 2) {
            const el = document.createElementNS(NS, 'polyline');
            el.setAttribute('points', shape.points.map((p) => `${p.x},${p.y}`).join(' '));
            el.setAttribute('fill', 'none');
            el.setAttribute('stroke', stroke);
            el.setAttribute('stroke-width', '2.5');
            el.setAttribute('stroke-linejoin', 'round');
            el.setAttribute('stroke-linecap', 'round');
            svg.appendChild(el);
          }
        });
      });
      document.body.appendChild(svg);
    }, batch.annotations ?? []);
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
