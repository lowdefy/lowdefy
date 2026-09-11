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

// pdfmake renders SVG through svg-to-pdfkit, whose default image handler reads a
// non-`data:` href off the filesystem (PDFKit's openImage → fs.readFileSync).
// A chart SVG can carry an author- or data-derived `<image href="/etc/...">`,
// so strip every `<image>` whose href is not a `data:` URI before it reaches the
// renderer — an embedded data image is fine, a filesystem path is not.
//
// ECharts draws a label placed outside its bar with a white stroke under the
// fill (`paint-order="stroke"`) so it stays legible over any background.
// svg-to-pdfkit ignores paint-order and strokes over the glyphs, leaving only the
// fill's thinnest parts, so those labels print near-white. Dropping the stroke
// from such <text> elements keeps the fill, which is all the PDF can show.
const UNDER_STROKE_ATTRS = /\s(?:stroke|stroke-width|paint-order|stroke-miterlimit)=(['"]).*?\1/gi;

function sanitizeSvg(svg) {
  if (!type.isString(svg)) return svg;
  return svg
    .replace(/<image\b[^>]*>/gi, (tag) => {
      const href = /(?:xlink:)?href\s*=\s*(['"])(.*?)\1/i.exec(tag);
      if (href && /^\s*data:/i.test(href[2])) return tag;
      return '';
    })
    .replace(/<text\b[^>]*>/gi, (tag) => {
      if (!/\spaint-order=(['"])stroke\1/i.test(tag)) return tag;
      return tag.replace(UNDER_STROKE_ATTRS, '');
    });
}

export default sanitizeSvg;
