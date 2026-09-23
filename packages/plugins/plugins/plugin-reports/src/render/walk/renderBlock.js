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

import { validateNode } from '../../ir/nodes.js';
import applyReportOptions from './applyReportOptions.js';
import containerKindOf from './containerKindOf.js';
import passthroughNodes from './passthroughNodes.js';
import projectBlock from './projectBlock.js';
import toNodeList from './toNodeList.js';
import walkAreas from './walkAreas.js';

// Produce the IR node(s) for one block at its resolved width. A container walks
// its areas first, a list every item's areas, then the renderer is called with
// them; a block whose type has no renderer passes its children through and is
// recorded as unsupported.
async function renderBlock({ block, width, fraction, walk }) {
  const kind = containerKindOf(block);
  let areas;
  let items;
  if (kind === 'container') {
    areas = await walkAreas({ subSlot: block.subSlots?.[0], availableWidth: width, walk });
  }
  if (kind === 'list') {
    items = [];
    for (const subSlot of block.subSlots ?? []) {
      items.push(await walkAreas({ subSlot, availableWidth: width, walk }));
    }
  }

  const renderer = walk.registry[block.type];
  let nodes;
  if (type.isFunction(renderer?.toReport)) {
    // A renderer is plugin code operating on user data: a throw here is a
    // renderer bug or a hostile property, never a config error worth failing
    // the whole report for. Isolate it — skip the block, keep the document.
    // validateNode runs inside the try so malformed IR degrades the same way.
    try {
      const result = await renderer.toReport({
        block: projectBlock(block),
        areas,
        items,
        layout: { width, fraction },
        context: walk.context,
      });
      nodes = toNodeList(result);
      nodes.forEach((node) => validateNode(node));
    } catch (error) {
      walk.recordFailure(block, error);
      nodes = [];
    }
  } else {
    walk.recordUnsupported(block);
    nodes = passthroughNodes({ areas, items });
  }

  return applyReportOptions({ nodes, block, options: walk.optionsFor(block) });
}

export default renderBlock;
