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
import { mayApplyClass } from './readClassToken.js';

const FLEX_CLASS = /^(flex|inline-flex|grid|inline-grid|\[display:.+\])$/;

// Whether the element an Html block draws its html in (HtmlComponent's root, given the block's
// `.element` class and style) may be a flex or grid box, which lays the html's top-level children
// out as blocks. customBreakpoints is readClassToken's.
function isFlexElement({ block, customBreakpoints }) {
  const display = block.eval?.style?.element?.display;
  if (!type.isNone(display) && /flex|grid/.test(String(display))) return true;
  return mayApplyClass({
    tokens: collectClassTokens(block.eval?.class?.element),
    pattern: FLEX_CLASS,
    customBreakpoints,
  });
}

export default isFlexElement;
