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

import { row, spacer, stack } from '../../ir/nodes.js';
import { columnWidthOf } from '../geometry.js';
import renderBlock from './renderBlock.js';

// Render the blocks queued for one row and emit it. Rendering waits until the
// row closes because a chart or Html block bakes its width into its SVG, and a
// cell's width is only known once every sibling on the row is: three `flex: 1`
// charts each get a third of the row, not the whole of it. A cell whose render
// yields nothing is dropped along with its width; a row left with no cells emits
// nothing; a lone content-sized cell is just a block and needs no row.
async function flushRow({ pending, availableWidth, walk }) {
  if (pending.entries.length === 0) return [];
  const count = pending.entries.reduce((sum, entry) => sum + (entry.offset > 0 ? 2 : 1), 0);

  const cells = [];
  const widths = [];
  for (const entry of pending.entries) {
    const fraction = pending.mode === 'grid' ? entry.fraction : 1;
    const width = columnWidthOf({
      availableWidth,
      count,
      fraction: pending.mode === 'grid' ? entry.fraction : undefined,
    });
    const nodes = await renderBlock({ block: entry.block, width, fraction, walk });
    if (nodes.length === 0) continue;
    if (entry.offset > 0) {
      cells.push(spacer({ width: entry.offset }));
      widths.push(entry.offset);
    }
    cells.push(nodes.length === 1 ? nodes[0] : stack({ children: nodes }));
    widths.push(pending.mode === 'grid' ? entry.fraction : entry.flexWidth);
  }

  if (cells.length === 0) return [];
  if (cells.length === 1 && !type.isNumber(widths[0])) return [cells[0]];

  // Give the last content-sized child the spare width when nothing grows, the
  // way a flex row's last item absorbs the slack. This also bounds the row to
  // the available width instead of letting content run past it.
  const grows = widths.some((width) => width === 'fill' || type.isNumber(width));
  const bounded = grows
    ? widths
    : widths.map((width, index) => (index === widths.length - 1 ? 'fill' : width));
  return [row({ children: cells, widths: bounded })];
}

export default flushRow;
