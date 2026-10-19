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

const DRAG_THRESHOLD = 4;

// A click that ends a text selection (drag, or a selection inside the table) is not a row click,
// so copying text out of a row never navigates.
function isTextDrag({ event, api }) {
  const start = api.pointerStart;
  if (start) {
    const distance = Math.abs(event.clientX - start.x) + Math.abs(event.clientY - start.y);
    if (distance > DRAG_THRESHOLD) return true;
  }
  const selection = window.getSelection?.();
  if (!selection || selection.isCollapsed || selection.toString() === '') return false;
  const anchor = selection.anchorNode;
  const element = anchor?.nodeType === 1 ? anchor : anchor?.parentElement;
  return api.contains(element);
}

export default isTextDrag;
