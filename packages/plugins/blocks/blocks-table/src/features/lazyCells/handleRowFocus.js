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

import getBodyRowKey from './getBodyRowKey.js';

// Keyboard focus inside a row (navigation, Tab) reveals and mounts its hover-only buttons. Focus
// a mouse click leaves behind (on a row checkbox, a cell) does not: the buttons follow the pointer
// to the next hovered row instead of staying on the clicked one.
function handleRowFocus(event, api) {
  const keyboard = event.target.matches(':focus-visible');
  api.cellActivity.set({ focusedRow: keyboard ? getBodyRowKey(event.target) : null });
  return false;
}

export default handleRowFocus;
