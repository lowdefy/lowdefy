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

import createCloseColumnManager from './createCloseColumnManager.js';
import createOpenColumnManager from './createOpenColumnManager.js';
import createResetColumns from './createResetColumns.js';
import getColumnManagerMenuItems from './getColumnManagerMenuItems.js';
import useColumnManager from './useColumnManager.js';

import './columnManager.css';

// The column manager (D7): every declared column with search, visibility checkboxes, drag to
// reorder, the pinned boundaries and "Reset to default". Opened from the header menu
// ("Columns…"), the `openColumnManager` method, or the toolbar.
const columnManagerFeature = {
  name: 'columnManager',
  headerMenuItems: getColumnManagerMenuItems,
  actions: {
    openColumnManager: createOpenColumnManager,
    closeColumnManager: createCloseColumnManager,
    resetColumns: createResetColumns,
  },
  methods: { openColumnManager: createOpenColumnManager },
  useFeature: useColumnManager,
};

export default columnManagerFeature;
