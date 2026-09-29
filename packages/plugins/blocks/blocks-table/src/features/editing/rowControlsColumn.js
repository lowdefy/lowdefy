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

import getRowControlsWidth from './getRowControlsWidth.js';
import RowControlsCell from './RowControlsCell.js';
import RowControlsHeader from './RowControlsHeader.js';

export const ROW_CONTROLS_KEY = '__row';
export const ROW_CONTROLS_SPECIAL = 'row';

// The leading special column for TableInput's row controls, sized to the controls it holds.
function rowControlsColumn({ rowDrag, deleteButton }) {
  return {
    key: ROW_CONTROLS_KEY,
    special: ROW_CONTROLS_SPECIAL,
    width: getRowControlsWidth({ rowDrag, deleteButton }),
    Header: RowControlsHeader,
    Cell: RowControlsCell,
  };
}

export default rowControlsColumn;
