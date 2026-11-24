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

// Style properties that change how text reads, as React's camelCase or CSS's kebab-case, and
// whether a value does.
const STYLED_PROPERTIES = {
  display: (value) => value === 'none',
  textTransform: (value) => value !== 'none',
  'text-transform': (value) => value !== 'none',
  visibility: (value) => ['hidden', 'collapse'].includes(value),
  // nowrap and normal collapse white space as readHtmlPieces' runs assume.
  whiteSpace: (value) => /^(pre|break-spaces)/.test(String(value)),
  'white-space': (value) => /^(pre|break-spaces)/.test(String(value)),
};

// Whether a style object (a block's style, one of its per-element styles, or a Descriptions
// item's) may change how the text under it reads. Where the text is drawn with its white space
// kept (pre-wrap, a Descriptions item), any other white space a style sets changes it too. A
// style given as a function (an itemOption's) draws a style this cannot read.
function isStyledStyle({ style, pre = false }) {
  if (type.isFunction(style)) return true;
  if (!type.isObject(style)) return false;
  return Object.entries(style).some(([key, value]) => {
    if (type.isObject(value)) return isStyledStyle({ style: value, pre });
    if (pre && ['whiteSpace', 'white-space'].includes(key)) return value !== 'pre-wrap';
    return Object.hasOwn(STYLED_PROPERTIES, key) && STYLED_PROPERTIES[key](value);
  });
}

export default isStyledStyle;
