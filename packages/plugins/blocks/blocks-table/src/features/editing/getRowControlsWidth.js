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

const HANDLE_WIDTH = 20;
const DELETE_WIDTH = 26;
const PADDING = 8;

// The row controls column's width, sized to the controls it holds (a drag handle, a delete
// button). The lazy block's fallback reserves the same width.
function getRowControlsWidth({ rowDrag, deleteButton }) {
  return PADDING + (rowDrag ? HANDLE_WIDTH : 0) + (deleteButton ? DELETE_WIDTH : 0);
}

export default getRowControlsWidth;
