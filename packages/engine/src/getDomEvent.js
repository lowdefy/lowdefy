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

import getGlobals from './getGlobals.js';

// The DOM event whose listeners are running: the browser sets window.event while a listener runs,
// including the microtasks that run before the listener returns (React flushes discrete updates and
// their effects there), and leaves it undefined outside a DOM dispatch. Hosts without DOM events
// (engine harnesses, native) have no window.event.
function getDomEvent({ lowdefy }) {
  const domEvent = getGlobals(lowdefy).window?.event;
  if (typeof domEvent?.composedPath !== 'function') return null;
  return domEvent;
}

export default getDomEvent;
