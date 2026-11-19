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

import collectBlockParents from './collectBlockParents.js';

// Whether the engine skips `container`'s events for a click on `block` (claimDomEvent): the
// innermost block on the click's path with onClick actions handles the DOM event, and the blocks
// further out skip the events they fire for it, unless that onClick sets `bubble: true`. So a
// click on a Button inside a click DropdownMenu toggles the dropdown, and the dropdown's
// onOpenChange does not run.
function isClickClaimed({ actor, block, container }) {
  const { parents } = collectBlockParents({ context: actor.page.context });
  let current = block;
  while (current && current.id !== container.id) {
    const { events } = current.Events;
    if (Object.hasOwn(events, 'onClick') && events.onClick.bubble !== true) {
      return true;
    }
    current = parents.get(current.id);
  }
  return false;
}

export default isClickClaimed;
