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

import handleTreeClick from './handleTreeClick.js';
import handleTreeKeyDown from './handleTreeKeyDown.js';
import TreeToggle from './TreeToggle.js';
import useTreeData from './useTreeData.js';
import useTreeItems from './useTreeItems.js';

import './tree.css';

// Client-mode trees (`tree: { childrenField }` or `{ parentField }`): rows are indented under
// their parents with an expand chevron in the first data column; `expanded` in the value holds
// the expanded row keys. With `tree.lazy`, expanding a row whose children are not loaded fires
// `onRowExpand` and the app adds them to `data`.
const treeFeature = {
  name: 'tree',
  useData: useTreeData,
  useItems: useTreeItems,
  cellLead: TreeToggle,
  gridHandlers: { click: handleTreeClick, keydown: handleTreeKeyDown },
};

export default treeFeature;
