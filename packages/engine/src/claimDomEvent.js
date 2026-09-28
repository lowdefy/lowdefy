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

import outsideDomEventScope from './outsideDomEventScope.js';

// DOM event -> id of the block whose event handled it. Weak, so dispatched events are collected.
const domEventHandlers = new WeakMap();

// A DOM event bubbles through every block that wraps its target, and each of those blocks may
// fire an event for it: a Button click also reaches the clickable Card around it. The first
// block with actions for the event handles it, and other blocks skip the same DOM event unless
// the handling event sets `bubble: true`. window.event is the DOM event whose listeners are
// running (React dispatches synchronously inside it), and undefined outside a DOM dispatch, so
// events fired by actions (runOutsideDomEvent), timers or requests are never affected.
//
// React's scheduler runs renders and effects inside MessageChannel `message` events, so an event a
// block fires from an effect (a table fetching its first rows on mount) sees that message as
// window.event. It is not a user interaction and is shared by every block the task mounts, so it
// is never claimed.
//
// An internal event (registered by the block itself) is never skipped: a block can fire one from
// an effect React flushes inside another block's click (a Table fetching rows after a Button set
// its filter). It still claims an unclaimed DOM event, as the block's own handler would.
function claimDomEvent({ blockId, bubble, hasActions, internal }) {
  const domEvent = globalThis.window?.event;
  if (!(domEvent instanceof globalThis.Event)) return null;
  if (outsideDomEventScope.depth > 0) return null;
  if (typeof MessageEvent !== 'undefined' && domEvent instanceof MessageEvent) return null;
  const handledBy = domEventHandlers.get(domEvent);
  if (handledBy !== undefined && handledBy !== blockId) {
    return internal === true ? null : handledBy;
  }
  if (hasActions && !bubble) {
    domEventHandlers.set(domEvent, blockId);
  }
  return null;
}

export default claimDomEvent;
