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

import { columnOrderingFeature } from '@tanstack/react-table';

import handleReorderPointerDown from './handleReorderPointerDown.js';
import initColumnOrder from './initColumnOrder.js';

// `columnOrder` is the order of `view.columns`; the core assembles each view column entry in this
// order and asks the other features (sizing, pinning, visibility) to decorate it.
const orderingFeature = {
  name: 'ordering',
  tableFeatures: { columnOrderingFeature },
  slices: {
    columnOrder: { init: initColumnOrder, cause: 'columns' },
  },
  gridHandlers: { pointerdown: handleReorderPointerDown },
};

export default orderingFeature;
