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

import handleToolbarKeyDown from './handleToolbarKeyDown.js';
import useToolbar from './useToolbar.js';

// The toolbar above the grid (D7, off by default per D15). It holds no state of its own: every
// control writes the view through the slices and actions the other features own (search and
// filter, sorting, grouping, density, the column manager, export) and the saved views.
const toolbarFeature = {
  name: 'toolbar',
  gridHandlers: { keydown: handleToolbarKeyDown },
  useFeature: useToolbar,
};

export default toolbarFeature;
