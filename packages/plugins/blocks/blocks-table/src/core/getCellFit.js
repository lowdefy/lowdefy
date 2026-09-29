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

import { type } from '@lowdefy/helpers';

const CHIP_TYPES = new Set(['tag', 'tags']);

// The shared renderer's `fit` for a cell: chip cells (`tag`, `tags`) on one line get their
// content width (the layout column's width less the cell padding), so they show only the chips
// that fit whole and a +N count. Cells with a lead (tree indent, expand chevron) or on wrapped or
// multi-line layouts show every chip, as the renderer does without `fit`.
function getCellFit({ api, col, lead }) {
  const { column } = col;
  if (!CHIP_TYPES.has(column.type) || !type.isNone(lead)) return undefined;
  if (column.wrap || (type.isInt(column.ellipsis) && column.ellipsis > 1)) return undefined;
  const measure = api.chipMeasure;
  return { width: col.width - measure.cellInset, measure };
}

export default getCellFit;
