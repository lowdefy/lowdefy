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

import { columnPinningFeature } from '@tanstack/react-table';

import initColumnPinning from './initColumnPinning.js';
import pinningToViewColumn from './pinningToViewColumn.js';

// Pinned columns render outside the column virtual range as position: sticky cells (D10.3); the
// layout reads the start/end regions from TanStack's pinning state.
const pinningFeature = {
  name: 'pinning',
  tableFeatures: { columnPinningFeature },
  slices: {
    columnPinning: { init: initColumnPinning, cause: 'columns' },
  },
  toViewColumn: pinningToViewColumn,
};

export default pinningFeature;
