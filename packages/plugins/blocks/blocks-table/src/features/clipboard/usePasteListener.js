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

import { useEffect } from 'react';

const NONE = {};

// Ctrl/Cmd+V is read from the `paste` event, not the key: the event carries the clipboard text
// without a permission prompt. It is fired at the focused cell and delegated from the root (one
// listener per table, like the grid's other events). Pastes into an open editor are the editor's.
function usePasteListener({ api }) {
  useEffect(() => {
    const root = api.rootRef.current;
    if (!root) return undefined;
    function onPaste(event) {
      if (!api.editing?.input || !api.config.keyboard) return;
      const cell = event.target.closest?.('[data-lf-cell]');
      if (!cell || !api.contains(cell) || event.target.closest('[data-lf-editor]')) return;
      const rowElement = cell.closest('[data-row-index]');
      const rowIndex = Number(rowElement?.dataset.rowIndex);
      if (!(rowIndex >= 0)) return;
      const text = event.clipboardData?.getData('text/plain');
      if (!text) return;
      event.preventDefault();
      api.actions.pasteCells({ text, rowIndex, colIndex: Number(cell.dataset.colIndex) });
    }
    root.addEventListener('paste', onPaste);
    return () => root.removeEventListener('paste', onPaste);
  }, []);
  return NONE;
}

export default usePasteListener;
