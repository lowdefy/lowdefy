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

// TableInput's one write path: a new changeset becomes the block value with one setValue (the
// changeset is small: only what changed, never the rows), then onChange { value, cause, rowKey }
// fires. It is kept as the latest value at once, so a second write before the engine re-renders
// (Tab through cells) builds on the first. `record` adds the write to the undo history; undo
// and redo themselves do not.
function createWriteChanges(api) {
  return function writeChanges({ changes, cause, rowKey, record = true, event = {} }) {
    const { editing } = api;
    const before = editing.changes;
    if (changes === before) return false;
    editing.changes = changes;
    if (record) editing.undo.push({ before, after: changes });
    editing.input.methods.setValue(changes);
    editing.input.methods.triggerEvent({
      name: 'onChange',
      event: { value: changes, cause, rowKey, ...event },
    });
    return true;
  };
}

export default createWriteChanges;
