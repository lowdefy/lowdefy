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
function sanitizeSvg(svg) {
  if (!type.isString(svg)) return svg;
  return svg.replace(/<image\b[^>]*>/gi, (tag) => {
    const href = /(?:xlink:)?href\s*=\s*(['"])(.*?)\1/i.exec(tag);
    if (href && /^\s*data:/i.test(href[2])) return tag;
    return '';
  });
}

export default sanitizeSvg;
