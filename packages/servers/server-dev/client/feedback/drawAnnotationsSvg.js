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

// Draws a batch's annotations (element outlines with index labels, plus the
// drawn rect/arrow/freehand shapes) as an SVG layer appended to document.body,
// id "lowdefy-feedback-annotations-svg" — callers remove it by id when done.
//
// Shared by two capture paths, so it MUST stay fully self-contained (no outer
// imports or closures): captureTabScreenshot.js calls it directly in the
// developer's tab, and captureAnnotatedScreenshot.js passes it to Playwright's
// page.evaluate, which serializes the function source into the headless page.
//
// Geometry is viewport-relative at the recorded scroll offset. The layer is
// positioned absolute at the CURRENT scroll offset (document coordinates
// covering the visible viewport box), which lands the shapes correctly both in
// a full-document rasterization (in-tab) and in a viewport screenshot after
// scrolling to the recorded offset (headless).
function drawAnnotationsSvg(annotations) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('id', 'lowdefy-feedback-annotations-svg');
  svg.setAttribute(
    'style',
    `position:absolute;left:${window.scrollX}px;top:${window.scrollY}px;` +
      `width:${window.innerWidth}px;height:${window.innerHeight}px;` +
      'pointer-events:none;z-index:2147483000;'
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
}

export default drawAnnotationsSvg;
