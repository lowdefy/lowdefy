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

import expandComponent from './expandComponent.js';

function makeContext(componentDefs) {
  return { context: { componentDefs }, pageId: 'home' };
}

test('expandComponent rewrites an instance into a Box with prefixed, prop-inlined body', () => {
  const componentDefs = {
    Pill: {
      id: 'Pill',
      props: { result: { type: 'string', required: true } },
      slots: [],
      blocks: [
        {
          id: 'label',
          type: 'Title',
          properties: { content: { _prop: 'result' } },
        },
      ],
    },
  };
  const block = {
    id: 'pill_a',
    type: 'Pill',
    props: { result: { _state: 'answer' } },
  };
  expandComponent(block, makeContext(componentDefs));
  expect(block.type).toBe('Box');
  expect(block.props).toBeUndefined();
  expect(block.blocks).toEqual([
    {
      id: 'pill_a.label',
      type: 'Title',
      properties: { content: { _state: 'answer' } },
    },
  ]);
});

test('expandComponent inlines _prop into a nested component instance props (forwarding)', () => {
  // A body block that is itself a component instance forwards the outer
  // component's prop. The inner instance must receive the use-site expression,
  // not a dangling { _prop } node (which has no props scope at runtime).
  const componentDefs = {
    Outer: {
      id: 'Outer',
      props: { tone: { type: 'string' } },
      slots: [],
      blocks: [
        {
          id: 'inner',
          type: 'Inner',
          props: { tone: { _prop: 'tone' } },
        },
      ],
    },
    Inner: {
      id: 'Inner',
      props: { tone: { type: 'string' } },
      slots: [],
      blocks: [{ id: 'tag', type: 'Tag', properties: { title: { _prop: 'tone' } } }],
    },
  };
  const block = {
    id: 'o',
    type: 'Outer',
    props: { tone: { _state: 'selected_tone' } },
  };
  expandComponent(block, makeContext(componentDefs));
  const innerInstance = block.blocks[0];
  expect(innerInstance.id).toBe('o.inner');
  expect(innerInstance.type).toBe('Inner');
  expect(innerInstance.props).toEqual({ tone: { _state: 'selected_tone' } });

  // buildSubBlocks recursion would expand the inner instance next; simulate it.
  expandComponent(innerInstance, makeContext(componentDefs));
  expect(innerInstance.type).toBe('Box');
  expect(innerInstance.blocks).toEqual([
    {
      id: 'o.inner.tag',
      type: 'Tag',
      properties: { title: { _state: 'selected_tone' } },
    },
  ]);
});

test('expandComponent leaves an undefined prop as null in the body', () => {
  const componentDefs = {
    Pill: {
      id: 'Pill',
      props: { tone: { type: 'string' } },
      slots: [],
      blocks: [{ id: 'label', type: 'Title', properties: { content: { _prop: 'tone' } } }],
    },
  };
  const block = { id: 'p', type: 'Pill' };
  expandComponent(block, makeContext(componentDefs));
  expect(block.blocks[0].properties.content).toBe(null);
});

test('expandComponent throws on a direct component cycle', () => {
  const componentDefs = {
    Rec: {
      id: 'Rec',
      props: {},
      slots: [],
      blocks: [{ id: 'inner', type: 'Rec' }],
    },
  };
  const block = { id: 'r', type: 'Rec' };
  expandComponent(block, makeContext(componentDefs));
  const inner = block.blocks[0];
  expect(() => expandComponent(inner, makeContext(componentDefs))).toThrow(
    'Component cycle detected: Rec -> Rec.'
  );
});

test('expandComponent inside a List keeps the $ index token in prefixed body ids', () => {
  // An instance authored inside a List carries a $ in its id (rows.$.pill).
  // Prefixed body ids must keep that single $ so applyArrayIndices resolves
  // one index level at runtime, exactly as for hand-written blocks.
  const componentDefs = {
    Pill: {
      id: 'Pill',
      props: { result: { type: 'string' } },
      slots: [],
      blocks: [{ id: 'label', type: 'Title', properties: { content: { _prop: 'result' } } }],
    },
  };
  const block = {
    id: 'rows.$.pill',
    type: 'Pill',
    props: { result: { _request: 'list.$.title' } },
  };
  expandComponent(block, makeContext(componentDefs));
  expect(block.blocks[0].id).toBe('rows.$.pill.label');
  expect(block.blocks[0].properties.content).toEqual({ _request: 'list.$.title' });
});

test('expandComponent splices slot fillers unprefixed and without prop inlining', () => {
  const componentDefs = {
    Pill: {
      id: 'Pill',
      props: { tone: { type: 'string' } },
      slots: ['footer'],
      blocks: [
        {
          id: 'wrap',
          type: 'Box',
          blocks: [{ _slot: 'footer' }],
        },
      ],
    },
  };
  const filler = {
    id: 'approve',
    type: 'Button',
    // A _prop in a slot filler belongs to the consumer's scope, never this
    // component's props — it must not be inlined here.
    properties: { title: { _prop: 'outer_prop' } },
  };
  const block = {
    id: 'pill',
    type: 'Pill',
    props: { tone: 'neutral' },
    slots: { footer: { blocks: [filler] } },
  };
  expandComponent(block, makeContext(componentDefs));
  const wrap = block.blocks[0];
  expect(wrap.id).toBe('pill.wrap');
  expect(wrap.blocks).toHaveLength(1);
  expect(wrap.blocks[0].id).toBe('approve');
  expect(wrap.blocks[0].properties.title).toEqual({ _prop: 'outer_prop' });
});
