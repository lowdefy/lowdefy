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

import makeFocusable from './makeFocusable.js';
import NATIVE_INTERACTIVE from './nativeInteractive.js';

// data-popover="id" toggles a popover showing the element with
// data-popover-content="id". The content's HTML is captured before any other
// enhancer touches it; the nested HtmlComponent that shows it enhances it.
const popoverEnhancer = {
  name: 'popover',
  attributes: ['data-popover', 'data-popover-content'],
  activates: '[data-popover]',
  prepare({ root, select }) {
    const popoverContents = {};
    root.querySelectorAll('[data-popover-content]').forEach((element) => {
      popoverContents[element.getAttribute('data-popover-content')] = element.innerHTML;
    });
    select('[data-popover]').forEach((element) => {
      makeFocusable(element);
      if (!element.matches(NATIVE_INTERACTIVE) && !element.hasAttribute('role')) {
        element.setAttribute('role', 'button');
      }
      element.setAttribute('aria-expanded', 'false');
    });
    return { popoverContents };
  },
  onClick({ event, host }) {
    const target = host.closestInRoot(event, '[data-popover]');
    if (!target) return;
    const { overlay } = host;
    const wasOpen = overlay?.kind === 'popover' && overlay.target === target;
    host.closeOverlay();
    if (wasOpen) return;
    const id = target.getAttribute('data-popover');
    const { popoverContents } = host.prepared.popover;
    if (!Object.hasOwn(popoverContents, id)) {
      console.warn(`data-popover="${id}" has no element with data-popover-content="${id}".`);
      return;
    }
    target.setAttribute('aria-expanded', 'true');
    host.openOverlay({
      kind: 'popover',
      target,
      html: popoverContents[id],
      onClose(reason) {
        target.setAttribute('aria-expanded', 'false');
        // Focus inside the closing popup would fall to the page; return it to
        // the trigger, unless the user clicked somewhere else.
        const focused = target.ownerDocument.activeElement;
        const focusInPopup =
          focused !== null && focused !== target.ownerDocument.body && !host.contains(focused);
        if (reason !== 'outside' && target.isConnected && focusInPopup) {
          target.focus();
        }
      },
    });
  },
};

export default popoverEnhancer;
