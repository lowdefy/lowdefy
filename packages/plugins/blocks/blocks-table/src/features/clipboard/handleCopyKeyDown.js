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

import getCopyText from './getCopyText.js';

// Ctrl/Cmd+C on a focused cell. A text selection inside the table wins: the browser copies that
// as usual.
function handleCopyKeyDown(event, api) {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'c') return false;
  if (!api.config.keyboard) return false;
  const cell = event.target.closest('[data-lf-cell]');
  if (!cell || !api.contains(cell) || event.target !== cell) return false;
  const selection = window.getSelection?.();
  if (selection && !selection.isCollapsed && selection.toString() !== '') return false;
  const rowElement = cell.closest('[data-row-index]');
  const rowId = Number(rowElement.dataset.rowIndex) < 0 ? null : rowElement.dataset.rowKey;
  const text = getCopyText({ api, rowId, colKey: cell.dataset.colKey });
  if (text === null) return false;
  event.preventDefault();
  navigator.clipboard?.writeText(text);
  return true;
}

export default handleCopyKeyDown;
