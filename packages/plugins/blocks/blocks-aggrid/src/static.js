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

/**
 * Static report renderers for blocks-aggrid, aggregated behind the `./static`
 * package export. Every AgGrid variant (theme and input alike) shares one
 * `grid` renderer, re-exported per block type name so the walker can look it up
 * by `block.type`. This entry stays free of ag-grid and React so the server can
 * load the registry without a browser runtime.
 */

import { agGridTable } from './agGridTable.static.js';

export const AgGridAlpine = agGridTable;
export const AgGridBalham = agGridTable;
export const AgGridMaterial = agGridTable;
export const AgGridInputAlpine = agGridTable;
export const AgGridInputBalham = agGridTable;
export const AgGridInputMaterial = agGridTable;
