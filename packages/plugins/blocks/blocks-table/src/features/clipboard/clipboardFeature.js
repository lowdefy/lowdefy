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

import createPasteCells from './createPasteCells.js';
import handleCopyKeyDown from './handleCopyKeyDown.js';
import usePasteListener from './usePasteListener.js';

// Copy (Table and TableInput): Ctrl/Cmd+C copies the focused cell, or the selected rows, as TSV
// of the displayed text. Paste (TableInput): TSV into editable cells from the focused cell.
const clipboardFeature = {
  name: 'clipboard',
  actions: { pasteCells: createPasteCells },
  gridHandlers: { keydown: handleCopyKeyDown },
  useGridFeature: usePasteListener,
};

export default clipboardFeature;
