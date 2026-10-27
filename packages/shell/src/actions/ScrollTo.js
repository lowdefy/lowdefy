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

import measureInScrollView from './measureInScrollView.js';

// Where the block's top lands, by scrollIntoView's `block` option. 'nearest' needs the current
// scroll position, which a ScrollView does not report, so it scrolls as 'start' does.
function getScrollTop({ align, element, viewport }) {
  switch (align) {
    case 'center':
      return element.top - (viewport.height - element.height) / 2;
    case 'end':
      return element.top - viewport.height + element.height;
    default:
      return element.top;
  }
}

// The native body of actions-core's ScrollTo: scrolls the page's ScrollView to a block's measured
// position, or to `top` and `left` as window.scrollTo does. A block not on the page is left alone,
// as on the web.
async function ScrollTo({ globals, methods, params }) {
  if (!type.isObject(params)) {
    throw new Error('Invalid ScrollTo, check action params.');
  }
  const pageId = methods.getPageId();
  const scrollView = globals.elements.find({ kind: 'scroll', pageId });
  if (scrollView === null) {
    return;
  }
  if (type.isNone(params.blockId)) {
    scrollView.scrollTo({
      animated: params.behavior === 'smooth',
      x: params.left ?? 0,
      y: params.top ?? 0,
    });
    return;
  }
  const view = globals.elements.find({ blockId: params.blockId, kind: 'view', pageId });
  if (view === null) {
    return;
  }
  const { element, viewport } = await measureInScrollView({ scrollView, view });
  scrollView.scrollTo({
    animated: params.options?.behavior === 'smooth',
    x: 0,
    y: Math.max(0, getScrollTop({ align: params.options?.block, element, viewport })),
  });
}

export default ScrollTo;
