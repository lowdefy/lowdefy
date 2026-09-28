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

// Ctrl/Cmd+C on the focused cell copies its displayed text. A text selection inside the table
// wins: the browser copies that as usual.
function copyCell({ cell, event }) {
  const selection = window.getSelection?.();
  if (selection && !selection.isCollapsed && selection.toString() !== '') return false;
  const text = cell.innerText.trim();
  navigator.clipboard?.writeText(text);
  event.preventDefault();
  return true;
}

export default copyCell;
