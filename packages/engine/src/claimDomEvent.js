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

// DOM event -> id of the block whose event handled it. Weak, so dispatched events are collected.
const domEventHandlers = new WeakMap();

// A DOM event bubbles through every block that wraps its target, and each of those blocks may
// fire an event for it: a Button click also reaches the clickable Card around it. The first
// block with actions for the event handles it, and other blocks skip the same DOM event unless
// the handling event sets `bubble: true`. window.event is the DOM event whose listeners are
// running (React dispatches synchronously inside it), and undefined outside a DOM dispatch, so
// events fired by actions, timers or requests are never affected.
function claimDomEvent({ blockId, bubble, hasActions }) {
  const domEvent = globalThis.window?.event;
  if (!(domEvent instanceof globalThis.Event)) return null;
  const handledBy = domEventHandlers.get(domEvent);
  if (handledBy !== undefined && handledBy !== blockId) return handledBy;
  if (hasActions && !bubble) {
    domEventHandlers.set(domEvent, blockId);
  }
  return null;
}

export default claimDomEvent;
