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

// Translate a resolved `image` node. The `resolveImages` pre-pass attaches a
// base64 `data` URL to every image whose bytes were acquired; an image without
// one failed resolution and is skipped (returns null) so the report still
// renders. Explicit `width`/`height` (points) win; with neither set the image
// keeps its natural size but is capped to the content width via `maxWidth`,
// which pdfmake clamps without upscaling.
function translateImage(node, ctx) {
  if (!type.isString(node.data)) return null;
  const translated = { image: node.data, unbreakable: true, margin: [0, 0, 0, 8] };
  const hasWidth = type.isNumber(node.width);
  const hasHeight = type.isNumber(node.height);
  if (hasWidth) translated.width = node.width;
  if (hasHeight) translated.height = node.height;
  if (!hasWidth && !hasHeight) translated.maxWidth = ctx.contentWidth;
  return translated;
}

export default translateImage;
