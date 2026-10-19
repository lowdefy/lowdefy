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

// The DOM event whose listeners are running: window.event is set while a listener runs, including
// the microtasks that run before the listener returns (React flushes discrete updates and their
// effects there), and undefined outside a DOM dispatch.
function getDomEvent() {
  // The engine's unit tests run without a window.
  if (typeof window === 'undefined') return null;
  const domEvent = window.event;
  if (!(domEvent instanceof Event)) return null;
  return domEvent;
}

export default getDomEvent;
