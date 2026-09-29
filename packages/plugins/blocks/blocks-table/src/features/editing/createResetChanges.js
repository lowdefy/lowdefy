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

import createEmptyChanges from './createEmptyChanges.js';

// TableInput's `resetChanges` method: drops every change (after the app saved them, or to
// discard them) and the undo history. A method call is the app's, so no onChange fires.
function createResetChanges(api) {
  return function resetChanges() {
    const { editing } = api;
    api.actions.cancelEdit({ refocus: false });
    editing.undo.clear();
    editing.changes = createEmptyChanges();
    editing.input.methods.setValue(editing.changes);
  };
}

export default createResetChanges;
