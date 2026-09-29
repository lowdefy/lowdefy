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

import domEventClaims from './domEventClaims.js';
import getDomEvent from './getDomEvent.js';
import getPathIndex from './getPathIndex.js';

// A DOM event bubbles through every block that wraps its target, and each of those blocks may fire
// an event for it: a Button click also reaches the clickable Card around it. The innermost block on
// the event's path with actions for the event handles it, and the blocks further out on the path
// skip their events for the same DOM event, unless the handling event sets `bubble: true`.
//
// Only blocks the DOM event passed through take part. Blocks fire events for other reasons while
// a DOM event is dispatched, and those are never skipped:
// - A block off the path: a Table next to a Button fires onSelectionChange from the effect that
//   commits the selection the Button's CallMethod cleared. React flushes that effect in a
//   microtask inside the click listener, so window.event is still the click. The same holds for
//   effects in React's scheduler `message` events, whose path has no blocks.
// - A block inside the handling block: a Table in a clickable Card fires onSelectionChange for a
//   checkbox after the Card's onClick ran. It runs, and holds the claim from then on.
// - A block an action called a method on (exemptFromDomEvent), even when it is on the path: a
//   Button in a Table's bulk action slot clearing the Table's selection.
// - An internal event (registered by the block itself, like a Table's row fetch). It still claims
//   an unclaimed DOM event, as the block's own handler would.
function claimDomEvent({ blockId, bubble, hasActions, internal }) {
  const domEvent = getDomEvent();
  if (domEvent === null) return null;
  const path = domEvent.composedPath();
  const index = getPathIndex({ blockId, path });
  if (index === -1) return null;
  if (domEventClaims.exempt.get(domEvent)?.has(blockId)) return null;
  const handledBy = domEventClaims.handledBy.get(domEvent);
  if (handledBy !== undefined && handledBy !== blockId) {
    const handledByIsInner = getPathIndex({ blockId: handledBy, path }) < index;
    if (handledByIsInner) {
      return internal === true ? null : handledBy;
    }
  }
  if (hasActions && !bubble) {
    domEventClaims.handledBy.set(domEvent, blockId);
  }
  return null;
}

export default claimDomEvent;
