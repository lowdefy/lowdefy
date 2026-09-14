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

import flexGrows from './flexGrows.js';
import flushRow from './flushRow.js';
import isFlexChild from './isFlexChild.js';
import logIgnoredLayout from './logIgnoredLayout.js';
import renderBlock from './renderBlock.js';
import throwIfAborted from './throwIfAborted.js';

// Grid width, in antd-style columns. A span equal to this is full width.
const FULL_SPAN = 24;

function emptyRow() {
  return { mode: undefined, entries: [], span: 0 };
}

// Walk a sibling list into IR. Blocks appear in source order; consecutive
// siblings whose numeric `layout.span` values sum to at most 24 share one row
// with `span/24` width fractions; a missing (or ≥ 24) span is full width and
// ends any open row; `offset` becomes a leading spacer.
//
// Flex sizing is honoured because ignoring it split the commonest tile pattern
// across two lines: a block carrying `flex`, `grow`, `shrink` or `size` sits
// inline with its siblings at its content width, or fills when it grows. A row
// holds grid columns or flex children, never both — a fraction and a content
// width cannot share one width budget — so a run that switches mode breaks into
// a row per mode. Row members render when the row closes (see flushRow).
async function walkSiblings({ blocks, availableWidth, walk }) {
  const output = [];
  let pending = emptyRow();

  const flush = async () => {
    output.push(...(await flushRow({ pending, availableWidth, walk })));
    pending = emptyRow();
  };

  for (const block of blocks) {
    throwIfAborted(walk.signal);
    if (block.visibleEval?.output === false) continue;
    if (walk.optionsFor(block).exclude === true) continue;
    // Reports are display documents.
    if (block.meta?.category === 'input') continue;

    const layout = block.layoutEval?.output ?? {};
    // antd's `span: 0` idiom hides a column; a zero (or negative) span is not
    // full width and has no fraction, so treat it as hidden.
    if (type.isNumber(layout.span) && layout.span <= 0) continue;
    logIgnoredLayout({ block, layout, logger: walk.logger });

    if (isFlexChild(layout)) {
      if (pending.mode === 'grid') await flush();
      pending.mode = 'flex';
      pending.entries.push({ block, offset: 0, flexWidth: flexGrows(layout) ? 'fill' : 'auto' });
      continue;
    }

    const span = type.isNumber(layout.span) ? layout.span : undefined;
    const offset = type.isNumber(layout.offset) && layout.offset > 0 ? layout.offset : 0;
    if (span === undefined || span >= FULL_SPAN) {
      await flush();
      output.push(...(await renderBlock({ block, width: availableWidth, fraction: 1, walk })));
      continue;
    }

    if (pending.mode === 'flex' || pending.span + offset + span > FULL_SPAN) await flush();
    pending.mode = 'grid';
    pending.entries.push({ block, offset: offset / FULL_SPAN, fraction: span / FULL_SPAN });
    pending.span += offset + span;
  }

  await flush();
  return output;
}

export default walkSiblings;
