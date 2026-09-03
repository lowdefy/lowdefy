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

function makeContext(componentDefs, warnings = []) {
  return {
    context: {
      componentDefs,
      handleWarning: (warning) => warnings.push(warning),
    },
    pageId: 'home',
  };
}

test('expandComponent prefixes nested body block ids under the instance id', () => {
  const componentDefs = {
    Pill: {
      id: 'Pill',
      props: { result: { type: 'string', required: true } },
      slots: [],
      blocks: [
        {
          id: 'wrap',
          type: 'Box',
          blocks: [{ id: 'label', type: 'Title', properties: { content: { _prop: 'result' } } }],
        },
      ],
    },
  };
  const block = { id: 'pill_a', type: 'Pill', props: { result: { _state: 'answer' } } };
  expandComponent(block, makeContext(componentDefs));
  expect(block.type).toBe('Box');
  expect(block.props).toBeUndefined();
  expect(block.blocks).toEqual([
    {
      id: 'pill_a.wrap',
      type: 'Box',
      blocks: [
        { id: 'pill_a.label', type: 'Title', properties: { content: { _state: 'answer' } } },
      ],
    },
  ]);
});

test('expandComponent gives two instances of one component disjoint state paths', () => {
  const componentDefs = {
    Pill: {
      id: 'Pill',
      props: {},
      slots: [],
      blocks: [{ id: 'input', type: 'TextInput' }],
    },
  };
  const a = { id: 'pill_a', type: 'Pill' };
  const b = { id: 'pill_b', type: 'Pill' };
  expandComponent(a, makeContext(componentDefs));
  expandComponent(b, makeContext(componentDefs));
  expect(a.blocks[0].id).toBe('pill_a.input');
  expect(b.blocks[0].id).toBe('pill_b.input');
  expect(a.blocks[0].id).not.toBe(b.blocks[0].id);
});

test('expandComponent preserves a List "$" in a body block id', () => {
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

test('expandComponent inlines a use-site operator expression into body events', () => {
  const componentDefs = {
    Pill: {
      id: 'Pill',
      props: { target: { type: 'string' } },
      slots: [],
      blocks: [
        {
          id: 'go',
          type: 'Button',
          events: {
            onClick: [{ id: 'link', type: 'Link', params: { pageId: { _prop: 'target' } } }],
          },
        },
      ],
    },
  };
  const block = { id: 'p', type: 'Pill', props: { target: { _state: 'next_page' } } };
  expandComponent(block, makeContext(componentDefs));
  expect(block.blocks[0].events.onClick[0].params.pageId).toEqual({ _state: 'next_page' });
});

test('expandComponent inlines a _prop in a body block requests payload', () => {
  const componentDefs = {
    Pill: {
      id: 'Pill',
      props: { user_id: { type: 'string' } },
      slots: [],
      blocks: [
        {
          id: 'root',
          type: 'Box',
          requests: [
            { id: 'load', type: 'MongoDBFindOne', payload: { userId: { _prop: 'user_id' } } },
          ],
        },
      ],
    },
  };
  const block = { id: 'p', type: 'Pill', props: { user_id: { _state: 'uid' } } };
  expandComponent(block, makeContext(componentDefs));
  expect(block.blocks[0].requests[0].payload).toEqual({ userId: { _state: 'uid' } });
});

test('expandComponent forwards a prop into a nested component instance props', () => {
  // A body block that is itself a component instance forwards the outer
  // component's prop. The inner instance must receive the use-site expression,
  // not a dangling { _prop } node.
  const componentDefs = {
    Outer: {
      id: 'Outer',
      props: { tone: { type: 'string' } },
      slots: [],
      blocks: [{ id: 'inner', type: 'Inner', props: { tone: { _prop: 'tone' } } }],
    },
    Inner: {
      id: 'Inner',
      props: { tone: { type: 'string' } },
      slots: [],
      blocks: [{ id: 'tag', type: 'Tag', properties: { title: { _prop: 'tone' } } }],
    },
  };
  const block = { id: 'o', type: 'Outer', props: { tone: { _state: 'selected_tone' } } };
  expandComponent(block, makeContext(componentDefs));
  const innerInstance = block.blocks[0];
  expect(innerInstance.id).toBe('o.inner');
  expect(innerInstance.type).toBe('Inner');
  expect(innerInstance.props).toEqual({ tone: { _state: 'selected_tone' } });

  // buildSubBlocks recursion would expand the inner instance next; simulate it.
  expandComponent(innerInstance, makeContext(componentDefs));
  expect(innerInstance.type).toBe('Box');
  expect(innerInstance.blocks).toEqual([
    { id: 'o.inner.tag', type: 'Tag', properties: { title: { _state: 'selected_tone' } } },
  ]);
});

test('expandComponent leaves slot-filler blocks in the consumer scope', () => {
  const componentDefs = {
    Pill: {
      id: 'Pill',
      props: { tone: { type: 'string' } },
      slots: ['footer'],
      blocks: [{ id: 'wrap', type: 'Box', blocks: [{ _slot: 'footer' }] }],
    },
  };
  const filler = {
    id: 'approve',
    type: 'Button',
    // The filler is written at the use site, so its operators are the
    // consumer's — they must be neither prefixed nor prop-inlined here.
    properties: { title: { _state: 'approve_label' } },
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
  expect(wrap.blocks).toEqual([
    { id: 'approve', type: 'Button', properties: { title: { _state: 'approve_label' } } },
  ]);
});

test('expandComponent honours slot content written under the deprecated areas key', () => {
  const componentDefs = {
    Pill: {
      id: 'Pill',
      props: {},
      slots: ['footer'],
      blocks: [{ id: 'wrap', type: 'Box', blocks: [{ _slot: 'footer' }] }],
    },
  };
  const warnings = [];
  const block = {
    id: 'pill',
    type: 'Pill',
    areas: { footer: { blocks: [{ id: 'approve', type: 'Button' }] } },
  };
  expandComponent(block, makeContext(componentDefs, warnings));
  expect(block.areas).toBeUndefined();
  expect(block.blocks[0].blocks).toEqual([{ id: 'approve', type: 'Button' }]);
  expect(warnings[0].message).toMatch('"areas" is deprecated, use "slots"');
});

test('expandComponent throws when an instance has both areas and slots', () => {
  const componentDefs = {
    Pill: { id: 'Pill', props: {}, slots: ['footer'], blocks: [{ id: 'wrap', type: 'Box' }] },
  };
  const block = {
    id: 'pill',
    type: 'Pill',
    areas: { footer: { blocks: [] } },
    slots: { footer: { blocks: [] } },
  };
  expect(() => expandComponent(block, makeContext(componentDefs))).toThrow(
    'cannot have both "areas" and "slots"'
  );
});

test('expandComponent drops the key of an unsupplied optional prop with no default', () => {
  const componentDefs = {
    Pill: {
      id: 'Pill',
      props: { tone: { type: 'string' } },
      slots: [],
      blocks: [
        { id: 'label', type: 'Title', properties: { content: 'x', color: { _prop: 'tone' } } },
      ],
    },
  };
  const block = { id: 'p', type: 'Pill' };
  expandComponent(block, makeContext(componentDefs));
  expect(block.blocks[0].properties).toEqual({ content: 'x' });
  expect('color' in block.blocks[0].properties).toBe(false);
});

test('expandComponent uses a declared default for an unsupplied prop', () => {
  const componentDefs = {
    Pill: {
      id: 'Pill',
      props: { tone: { type: 'string', default: 'neutral' } },
      slots: [],
      blocks: [{ id: 'label', type: 'Title', properties: { color: { _prop: 'tone' } } }],
    },
  };
  const block = { id: 'p', type: 'Pill' };
  expandComponent(block, makeContext(componentDefs));
  expect(block.blocks[0].properties.color).toBe('neutral');
});

test('expandComponent throws when a body reads a prop the component does not declare', () => {
  const componentDefs = {
    Pill: {
      id: 'Pill',
      props: { tone: { type: 'string' } },
      slots: [],
      blocks: [{ id: 'label', type: 'Title', properties: { content: { _prop: 'tne' } } }],
    },
  };
  const block = { id: 'p', type: 'Pill', props: { tone: 'a' } };
  expect(() => expandComponent(block, makeContext(componentDefs))).toThrow(
    'Component "Pill" body reads prop "tne" which is not declared. Declared props: tone.'
  );
});

test('expandComponent rejects a _prop that survives expansion in a block id', () => {
  const componentDefs = {
    Pill: {
      id: 'Pill',
      props: { name: { type: 'string' } },
      slots: [],
      blocks: [{ id: { _prop: 'name' }, type: 'Title' }],
    },
  };
  const block = { id: 'p', type: 'Pill', props: { name: 'x' } };
  expect(() => expandComponent(block, makeContext(componentDefs))).toThrow(
    'left an unresolved _prop at "p.blocks[0].id"'
  );
});

test('expandComponent rejects a _prop in a slot filler, which has no props scope', () => {
  const componentDefs = {
    Pill: {
      id: 'Pill',
      props: {},
      slots: ['footer'],
      blocks: [{ id: 'wrap', type: 'Box', blocks: [{ _slot: 'footer' }] }],
    },
  };
  const block = {
    id: 'pill',
    type: 'Pill',
    slots: {
      footer: {
        blocks: [{ id: 'approve', type: 'Button', properties: { title: { _prop: 'x' } } }],
      },
    },
  };
  expect(() => expandComponent(block, makeContext(componentDefs))).toThrow(
    'left an unresolved _prop'
  );
});

test('expandComponent throws when a body references an undeclared slot', () => {
  const componentDefs = {
    Pill: {
      id: 'Pill',
      props: {},
      slots: [],
      blocks: [{ id: 'wrap', type: 'Box', blocks: [{ _slot: 'footer' }] }],
    },
  };
  const block = { id: 'pill', type: 'Pill' };
  expect(() => expandComponent(block, makeContext(componentDefs))).toThrow(
    'body references slot "footer" which is not in its declared slots'
  );
});

test('expandComponent throws on a direct component cycle', () => {
  const componentDefs = {
    Rec: { id: 'Rec', props: {}, slots: [], blocks: [{ id: 'inner', type: 'Rec' }] },
  };
  const block = { id: 'r', type: 'Rec' };
  expandComponent(block, makeContext(componentDefs));
  const inner = block.blocks[0];
  expect(() => expandComponent(inner, makeContext(componentDefs))).toThrow(
    'Component cycle detected: Rec -> Rec.'
  );
});

test('expandComponent ignores a block whose type is not a component', () => {
  const block = { id: 'b', type: 'Box' };
  expandComponent(block, makeContext({}));
  expect(block).toEqual({ id: 'b', type: 'Box' });
});
