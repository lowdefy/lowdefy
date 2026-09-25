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

import isOverlayBusy from './isOverlayBusy.js';
import visibleText from './visibleText.js';

const LINES = /^[1-6]?$/;
// -webkit-box takes these out of table and list layout.
const LAYOUT_ELEMENTS = 'td, th, tr, li';

function isClipped(element) {
  return (
    element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1
  );
}

// The full text of a clipped element, on hover or when something inside it
// takes focus. A data-tooltip or a native title wins, so only one tooltip shows.
function openTruncateTooltip({ event, host }) {
  if (isOverlayBusy(host.overlay)) return;
  if (host.closestInRoot(event, '[data-tooltip]')) return;
  const target = host.closestInRoot(event, '[data-truncate]');
  if (!target || host.overlay?.target === target) return;
  if (target.hasAttribute('title') || !isClipped(target)) return;
  host.openOverlay({
    kind: 'tooltip',
    target,
    content: visibleText(target),
  });
}

// data-truncate clamps text to 1–6 lines (the stylesheet does the clamping)
// and shows the full text in a tooltip when it is cut off.
const truncateEnhancer = {
  name: 'truncate',
  attributes: ['data-truncate'],
  prepare({ select }) {
    select('[data-truncate]').forEach((element) => {
      const lines = element.getAttribute('data-truncate');
      if (!LINES.test(lines)) {
        console.warn(
          `data-truncate="${lines}" is not a line count from 1 to 6, so it was ignored.`
        );
      }
      if (element.matches(LAYOUT_ELEMENTS)) {
        console.warn(
          `data-truncate on a <${element.tagName.toLowerCase()}> breaks its table or list layout. Truncate a <div> inside it instead.`
        );
      }
    });
  },
  onMouseOver: openTruncateTooltip,
  onFocus: openTruncateTooltip,
};

export default truncateEnhancer;
