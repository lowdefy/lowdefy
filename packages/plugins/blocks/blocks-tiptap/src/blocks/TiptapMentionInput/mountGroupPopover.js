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

import { autoUpdate, computePosition, offset } from '@floating-ui/dom';

import createPopupMiddleware from './createPopupMiddleware.js';

// Shows the popover 10px above the chip, kept in place while the page scrolls or resizes.
// Returns a function that removes it.
function mountGroupPopover({ chip, content }) {
  document.body.appendChild(content);

  function updatePosition() {
    computePosition(chip, content, {
      placement: 'top-start',
      middleware: [offset(10), ...createPopupMiddleware()],
    }).then(({ x, y }) => {
      content.style.left = `${x}px`;
      content.style.top = `${y}px`;
    });
  }

  const stopAutoUpdate = autoUpdate(chip, content, updatePosition);

  return function unmountGroupPopover() {
    stopAutoUpdate();
    content.remove();
  };
}

export default mountGroupPopover;
