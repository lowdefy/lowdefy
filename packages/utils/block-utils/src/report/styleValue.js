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

// Read one CSS property from a block's evaluated style.
//
// A bare `style: { height: 76 }` does not survive the build as written: styles
// are keyed by the block's css keys, and the build files a bare style under
// `block`, while `style: { element: {...} }` stays where the author put it. A
// report collapses a block's several DOM nodes into one rendered box, so it
// takes the most specific value on offer: the inner element, then the block
// wrapper, then a flat style.
function styleValue(style, key) {
  if (!type.isObject(style)) return undefined;
  return style.element?.[key] ?? style.block?.[key] ?? style[key];
}

export default styleValue;
