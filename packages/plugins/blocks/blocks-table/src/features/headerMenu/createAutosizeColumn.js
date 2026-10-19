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

import measureColumnWidth from './measureColumnWidth.js';

// Action `autosizeColumn({ key })`: fits the column to its rendered content, within its min and
// max width, and commits the width like the end of a resize drag.
function createAutosizeColumn(api) {
  return function autosizeColumn({ key }) {
    const col = api.layout.byKey.get(key);
    if (!col) return false;
    const measured = measureColumnWidth({ api, key });
    const width = Math.min(col.maxWidth, Math.max(col.minWidth, measured));
    if (width === col.width) return true;
    api.updateSlice('columnSizing', (previous) => ({ ...previous, [key]: width }));
    return true;
  };
}

export default createAutosizeColumn;
