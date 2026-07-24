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

import walkBlocks from '../../../../../reports/src/render/walkBlocks.js';
import * as registry from './index.js';

// A minimal evaluated-tree projection, shaped exactly as walkBlocks reads it:
// the page block hangs off _internal.RootSlots, and each block carries its
// meta.category (for container detection) plus propertiesEval/layoutEval output.
function block({ id, type, category, properties = {}, children }) {
  return {
    id,
    blockId: id,
    type,
    meta: { category },
    propertiesEval: { output: properties },
    layoutEval: { output: {} },
    ...(children ? { subSlots: [{ slots: { content: { blocks: children } } }] } : {}),
  };
}

function evaluatedContext(pageChildren) {
  const page = block({ id: 'page', type: 'Box', category: 'container', children: pageChildren });
  return { _internal: { RootSlots: { slots: { root: { blocks: [page] } } } } };
}

test('a Card of Title + Statistic + Paragraph walks to stack[heading, heading, stat, text]', () => {
  const context = evaluatedContext([
    block({
      id: 'card',
      type: 'Card',
      category: 'container',
      properties: { title: 'Sales' },
      children: [
        block({ id: 't', type: 'Title', category: 'display', properties: { content: 'Overview', level: 3 } }),
        block({ id: 's', type: 'Statistic', category: 'display', properties: { title: 'Revenue', value: 1000, prefix: '$' } }),
        block({ id: 'p', type: 'Paragraph', category: 'display', properties: { content: 'Body' } }),
      ],
    }),
  ]);

  const { nodes, warnings } = walkBlocks(context, registry, {}, { contentWidth: 500 });

  expect(warnings).toEqual([]);
  expect(nodes).toHaveLength(1);
  expect(nodes[0].kind).toBe('stack');
  expect(nodes[0].children.map((n) => n.kind)).toEqual(['heading', 'heading', 'stat', 'text']);
  expect(nodes[0].children[0]).toEqual({ kind: 'heading', text: 'Sales', level: 4 });
  expect(nodes[0].children[1]).toEqual({ kind: 'heading', text: 'Overview', level: 3 });
  expect(nodes[0].children[2]).toEqual({ kind: 'stat', label: 'Revenue', value: '$1,000' });
  expect(nodes[0].children[3]).toEqual({ kind: 'text', text: 'Body' });
});
