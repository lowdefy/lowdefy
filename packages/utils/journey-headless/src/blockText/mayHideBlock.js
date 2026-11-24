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

import collectClassTokens from './collectClassTokens.js';
import isLayoutHidden from './isLayoutHidden.js';
import { mayApplyClass } from './readClassToken.js';

const HIDING_CLASS = /^(hidden|\[display:.+\])$/;

function setsDisplayNone(style) {
  if (!type.isObject(style)) return false;
  return Object.entries(style).some(([key, value]) =>
    type.isObject(value) ? setsDisplayNone(value) : key === 'display' && value === 'none'
  );
}

// Whether a block may not be rendered (display: none) at the browser runner's width: its layout
// hides it (isLayoutHidden), or a style or class of it, or of one of its slots, may. A browser's
// innerText of an element that is not rendered, or of one inside it, is its textContent: every
// text node in it, hidden or not. customBreakpoints is readClassToken's.
function mayHideBlock({ block, customBreakpoints }) {
  return (
    isLayoutHidden({ layout: block.eval?.layout }) ||
    setsDisplayNone(block.eval?.style) ||
    Object.values(block.eval?.slots ?? {}).some((slot) => setsDisplayNone(slot?.style)) ||
    mayApplyClass({
      tokens: collectClassTokens(block.eval?.class),
      pattern: HIDING_CLASS,
      customBreakpoints,
    })
  );
}

export default mayHideBlock;
