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

// A block an action calls a method on acts for that action, not for the DOM event being
// dispatched: the events it fires for it (at once, or from the effects the method causes) are
// never skipped as copies of the DOM event bubbling through it. See claimDomEvent.
function exemptFromDomEvent({ blockId }) {
  const domEvent = getDomEvent();
  if (domEvent === null) return;
  const exempt = domEventClaims.exempt.get(domEvent) ?? new Set();
  exempt.add(blockId);
  domEventClaims.exempt.set(domEvent, exempt);
}

export default exemptFromDomEvent;
