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

import { createLazyBlock } from '@lowdefy/block-utils';

import meta from './meta.js';
import TableFallback from './TableFallback.js';

// The engine (TanStack Table + Virtual and the feature modules) loads with the block's first mount,
// not with the page's block chunk. The fallback holds the table's box so the page does not shift.
const Table = createLazyBlock({
  load: () => import('./Table.lazy.js'),
  meta,
  Fallback: TableFallback,
});

export default Table;
