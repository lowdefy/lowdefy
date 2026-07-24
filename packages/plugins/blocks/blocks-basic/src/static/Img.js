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

import { isBlank } from './utils.js';

/**
 * Img → `image`. `properties.src` names the source; `@lowdefy/reports` resolves
 * the bytes centrally (data URI, public asset, or guarded fetch). The block's
 * `width`/`height` properties become the IR node's width/height, carried
 * through as PostScript points — the same unit every other sizeable IR node
 * (svg, chart) uses, so all report sizing shares one scale. With neither set
 * the image keeps its natural size, capped to the content width. An empty src
 * yields no node.
 */
export const Img = {
  toReport: ({ block }) => {
    const { src, width, height } = block.properties ?? {};
    if (isBlank(src)) return null;
    return {
      kind: 'image',
      src: String(src),
      ...(type.isNumber(width) ? { width } : {}),
      ...(type.isNumber(height) ? { height } : {}),
    };
  },
};
