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

// Space from the popover's anchor down to the viewport edge, less the popover's own chrome.
const POPOVER_GAP = 4;
const VIEWPORT_MARGIN = 16;
const MIN_HEIGHT = 120;

// The height the column manager list may take: the popover opens below its anchor (the table's
// top end corner), so the list gets the viewport height below the anchor, less what the popover
// shows above and below the list (title, search, footer, padding). Measured from the anchor, not
// the popover, which antd has not placed yet when the list is first sized.
function getListRoom({ anchor, list }) {
  const popup = list.closest('.ant-popover') ?? list.parentElement;
  const listBox = list.getBoundingClientRect();
  const popupBox = popup.getBoundingClientRect();
  const chrome = listBox.top - popupBox.top + (popupBox.bottom - listBox.bottom);
  const top = anchor ? anchor.getBoundingClientRect().bottom + POPOVER_GAP : popupBox.top;
  return Math.max(MIN_HEIGHT, window.innerHeight - top - chrome - VIEWPORT_MARGIN);
}

export default getListRoom;
