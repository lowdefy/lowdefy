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

import { BLOCK_MARGIN } from './constants.js';
import urlOf from './urlOf.js';

// The pre-pass (resolveMarkdownImages) has already acquired the bytes; an image
// missing from the map failed resolution (the resolver logged why) and is
// skipped so the report still renders. Markdown carries no dimensions, so the
// image keeps its natural size capped to the content width.
function imageContent(node, state) {
  const data = state.images[urlOf(node, state)];
  if (!type.isString(data)) return [];
  return [
    {
      image: data,
      unbreakable: true,
      margin: BLOCK_MARGIN,
      ...(type.isNumber(state.contentWidth) ? { maxWidth: state.contentWidth } : {}),
    },
  ];
}

export default imageContent;
