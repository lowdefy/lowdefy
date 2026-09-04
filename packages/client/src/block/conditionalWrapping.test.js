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

import React from 'react';
import { render } from '@testing-library/react';
import { blockRootProps } from '@lowdefy/block-utils';

import CategorySwitch from './CategorySwitch.js';

const Leaf = ({ blockId, classNames, properties, styles }) => (
  <div {...blockRootProps({ blockId, classNames, styles })}>{properties?.content}</div>
);

const BoxLike = ({ blockId, classNames, content, properties, styles }) => (
  <div {...blockRootProps({ blockId, classNames, styles })}>
    {content.content && content.content(properties?.contentStyle)}
  </div>
);

// Row, Stack and Grid shape: the block lays its children out with its own CSS.
const SelfLayoutLike = ({ blockId, classNames, content, styles }) => (
  <div {...blockRootProps({ blockId, classNames, styles, className: 'flex' })}>
    {content.content && content.content(undefined, { selfLayout: true })}
  </div>
);

const ListLike = ({ blockId, classNames, list, styles }) => (
  <div {...blockRootProps({ blockId, classNames, styles })}>
    {list.map((item, i) => (
      <div className="list-item" key={i}>
        {item.content && item.content()}
      </div>
    ))}
  </div>
);

const blockComponents = {
  Box: BoxLike,
  Leaf,
  ListBlock: ListLike,
  RowLike: SelfLayoutLike,
  Skeleton: Leaf,
};
const blockMetas = {
  Box: { category: 'container' },
  Leaf: { category: 'display' },
  ListBlock: { category: 'list' },
  RowLike: { category: 'container' },
  Skeleton: { category: 'display' },
};

function createLowdefy() {
  return {
    basePath: '',
    menus: [],
    pageId: 'page',
    _internal: {
      blockComponents,
      blockMetas,
      components: {},
      progress: { dispatch: () => undefined },
      translate: (key) => key,
    },
  };
}

function createContext() {
  return {
    state: {},
    _internal: {
      lowdefy: { _internal: { progress: { dispatch: () => undefined } } },
      updaters: {},
    },
  };
}

function createBlock({ id, type = 'Leaf', eval: evalOverrides = {} }) {
  return {
    blockId: id,
    id,
    type,
    eval: { properties: {}, slots: {}, style: {}, layout: {}, ...evalOverrides },
    methods: {},
    registerEvent: () => undefined,
    registerMethod: () => undefined,
    triggerEvent: async () => undefined,
  };
}

// Blocks tree shape the client renders from: a container's children live under
// subSlots[containerId][0].slots[slotKey].blocks.
function createBlocks(container, children, { items = 1 } = {}) {
  const subSlot = {
    id: `${container.id}-0`,
    slots: { content: { blocks: children } },
    subSlots: {},
  };
  return { subSlots: { [container.id]: new Array(items).fill(subSlot) } };
}

function renderBlock(props) {
  return render(
    <CategorySwitch
      Blocks={{}}
      context={createContext()}
      loading={false}
      lowdefy={createLowdefy()}
      {...props}
    />
  );
}

test('a leaf block with no layout renders exactly its own root, with id, data-testid and its classes', () => {
  const block = createBlock({
    id: 'my_leaf',
    eval: { class: { block: 'bg-red-500', element: 'p-4' }, style: { block: { margin: 1 } } },
  });
  const { container } = renderBlock({ block });
  expect(container.querySelectorAll('.lf-col')).toHaveLength(0);
  expect(container.firstChild).toBe(container.querySelector('#my_leaf'));
  expect(container.querySelector('#my_leaf').getAttribute('data-testid')).toBe('my_leaf');
  expect(container.querySelector('#my_leaf').className).toBe('bg-red-500 p-4');
  expect(container.querySelector('#my_leaf').style.margin).toBe('1px');
});

test('a leaf block with a layout key renders inside its BlockLayout column', () => {
  const block = createBlock({ id: 'my_leaf', eval: { layout: { span: 12 } } });
  const { container } = renderBlock({ block });
  const col = container.querySelector('.lf-col');
  expect(col.id).toBe('bl-my_leaf');
  expect(col.firstChild.id).toBe('my_leaf');
});

test('the BlockLayout does not repeat the class and style the block root already carries', () => {
  const block = createBlock({
    id: 'my_leaf',
    eval: { class: { block: 'bg-red-500' }, layout: { span: 12 }, style: { block: { margin: 1 } } },
  });
  const { container } = renderBlock({ block });
  const col = container.querySelector('.lf-col');
  expect(col.className).toBe('lf-col');
  expect(col.style.margin).toBe('');
  expect(container.querySelector('#my_leaf').className).toBe('bg-red-500');
  expect(container.querySelector('#my_leaf').style.margin).toBe('1px');
});

test('a block with layout.disabled alone keeps the wrapper div it opted into', () => {
  const block = createBlock({ id: 'my_leaf', eval: { layout: { disabled: true } } });
  const { container } = renderBlock({ block });
  expect(container.querySelector('#bl-my_leaf')).not.toBeNull();
  expect(container.querySelector('.lf-col')).toBeNull();
});

test('a hidden block still renders its visibility placeholder', () => {
  const block = createBlock({ id: 'my_leaf', eval: { visible: false } });
  const { container } = renderBlock({ block });
  expect(container.querySelector('#vs-my_leaf')).not.toBeNull();
});

test('a container of plain blocks renders neither an Area nor a column', () => {
  const container_block = createBlock({ id: 'my_box', type: 'Box' });
  const children = [createBlock({ id: 'one' }), createBlock({ id: 'two' })];
  const { container } = renderBlock({
    block: container_block,
    Blocks: createBlocks(container_block, children),
  });
  expect(container.querySelectorAll('.lf-row')).toHaveLength(0);
  expect(container.querySelectorAll('.lf-col')).toHaveLength(0);
  expect([...container.querySelector('#my_box').children].map((el) => el.id)).toEqual([
    'one',
    'two',
  ]);
});

test('an arranged slot renders the Area, and every block in it gets a column', () => {
  const container_block = createBlock({
    id: 'my_box',
    type: 'Box',
    eval: { slots: { content: { gap: 16 } } },
  });
  const children = [createBlock({ id: 'one' }), createBlock({ id: 'two' })];
  const { container } = renderBlock({
    block: container_block,
    Blocks: createBlocks(container_block, children),
  });
  expect(container.querySelector('.lf-row').id).toBe('ar-my_box-content');
  expect(container.querySelectorAll('.lf-col')).toHaveLength(2);
});

test('a single laid out block makes the Area render and wraps its siblings too', () => {
  const container_block = createBlock({ id: 'my_box', type: 'Box' });
  const children = [
    createBlock({ id: 'one' }),
    createBlock({ id: 'two', eval: { layout: { span: 12 } } }),
  ];
  const { container } = renderBlock({
    block: container_block,
    Blocks: createBlocks(container_block, children),
  });
  expect(container.querySelectorAll('.lf-row')).toHaveLength(1);
  expect([...container.querySelectorAll('.lf-col')].map((el) => el.id)).toEqual([
    'bl-one',
    'bl-two',
  ]);
});

test('a content style passed by the block renders the Area that carries it', () => {
  const container_block = createBlock({
    id: 'my_box',
    type: 'Box',
    eval: { properties: { contentStyle: { display: 'contents' } } },
  });
  const children = [createBlock({ id: 'one' })];
  const { container } = renderBlock({
    block: container_block,
    Blocks: createBlocks(container_block, children),
  });
  const row = container.querySelector('.lf-row');
  expect(row.style.display).toBe('contents');
  expect(container.querySelectorAll('.lf-col')).toHaveLength(1);
});

test('a slot class renders the Area that carries it', () => {
  const container_block = createBlock({
    id: 'my_box',
    type: 'Box',
    eval: { class: { content: 'p-4' } },
  });
  const children = [createBlock({ id: 'one' })];
  const { container } = renderBlock({
    block: container_block,
    Blocks: createBlocks(container_block, children),
  });
  expect(container.querySelector('.lf-row').className).toContain('p-4');
});

test('a self laying out container renders the children roots as its own direct children', () => {
  const container_block = createBlock({ id: 'my_row', type: 'RowLike' });
  const children = [
    createBlock({ id: 'one', eval: { class: { block: 'grow' } } }),
    createBlock({ id: 'two' }),
  ];
  const { container } = renderBlock({
    block: container_block,
    Blocks: createBlocks(container_block, children),
  });
  expect(container.querySelectorAll('.lf-row')).toHaveLength(0);
  expect(container.querySelectorAll('.lf-col')).toHaveLength(0);
  expect([...container.querySelector('#my_row').children].map((el) => el.id)).toEqual([
    'one',
    'two',
  ]);
  expect(container.querySelector('#one').className).toBe('grow');
});

test('a laid out child of a self laying out container keeps its column, its siblings do not', () => {
  const container_block = createBlock({ id: 'my_row', type: 'RowLike' });
  const children = [
    createBlock({ id: 'one' }),
    createBlock({ id: 'two', eval: { layout: { span: 12 } } }),
  ];
  const { container } = renderBlock({
    block: container_block,
    Blocks: createBlocks(container_block, children),
  });
  expect(container.querySelectorAll('.lf-row')).toHaveLength(0);
  expect([...container.querySelectorAll('.lf-col')].map((el) => el.id)).toEqual(['bl-two']);
  expect([...container.querySelector('#my_row').children].map((el) => el.id)).toEqual([
    'one',
    'bl-two',
  ]);
});

test('a slot class does not force an Area on a self laying out container', () => {
  const container_block = createBlock({
    id: 'my_row',
    type: 'RowLike',
    eval: { class: { content: 'p-4' }, slots: { content: { gap: 16 } } },
  });
  const children = [createBlock({ id: 'one' })];
  const { container } = renderBlock({
    block: container_block,
    Blocks: createBlocks(container_block, children),
  });
  expect(container.querySelectorAll('.lf-row')).toHaveLength(0);
  expect(container.querySelector('#my_row').firstChild.id).toBe('one');
});

test('a list renders one row per item, and no wrappers when nothing is laid out', () => {
  const listBlock = createBlock({ id: 'my_list', type: 'ListBlock' });
  const children = [createBlock({ id: 'item_content' })];
  const { container } = renderBlock({
    block: listBlock,
    Blocks: createBlocks(listBlock, children, { items: 3 }),
  });
  expect(container.querySelectorAll('.list-item')).toHaveLength(3);
  expect(container.querySelectorAll('.lf-row')).toHaveLength(0);
  expect(container.querySelectorAll('.lf-col')).toHaveLength(0);
});

test('a list wraps its item blocks when the list slot is arranged', () => {
  const listBlock = createBlock({
    id: 'my_list',
    type: 'ListBlock',
    eval: { slots: { content: { gap: 8 } } },
  });
  const children = [createBlock({ id: 'item_content' })];
  const { container } = renderBlock({
    block: listBlock,
    Blocks: createBlocks(listBlock, children, { items: 2 }),
  });
  expect(container.querySelectorAll('.lf-row')).toHaveLength(2);
  expect(container.querySelectorAll('.lf-col')).toHaveLength(2);
});

test('an input container follows the same rule as a container', () => {
  blockMetas.InputBox = { category: 'input-container' };
  blockComponents.InputBox = BoxLike;
  const container_block = createBlock({ id: 'my_input_box', type: 'InputBox' });
  const children = [createBlock({ id: 'one' })];
  const bare = renderBlock({
    block: container_block,
    Blocks: createBlocks(container_block, children),
  });
  expect(bare.container.querySelectorAll('.lf-row')).toHaveLength(0);

  const arranged = renderBlock({
    block: createBlock({
      id: 'my_input_box',
      type: 'InputBox',
      eval: { slots: { content: { direction: 'column' } } },
    }),
    Blocks: createBlocks(container_block, children),
  });
  expect(arranged.container.querySelectorAll('.lf-row')).toHaveLength(1);
  expect(arranged.container.querySelectorAll('.lf-col')).toHaveLength(1);
});

test('a skeleton stands in the same box as the block it replaces', () => {
  const bare = renderBlock({
    block: createBlock({
      id: 'my_leaf',
      eval: { class: { block: 'bg-red-500' }, skeleton: { id: 's1', type: 'Skeleton' } },
    }),
    loading: true,
  });
  expect(bare.container.querySelectorAll('.lf-col')).toHaveLength(0);
  expect(bare.container.querySelector('#my_leaf').className).toBe('bg-red-500');

  const laidOut = renderBlock({
    block: createBlock({
      id: 'my_leaf',
      eval: { layout: { span: 12 }, skeleton: { id: 's1', type: 'Skeleton' } },
    }),
    loading: true,
  });
  expect(laidOut.container.querySelector('.lf-col').id).toBe('s-bl-my_leaf-s1');
});

test('a block in a rendered Area keeps its column while loading a skeleton', () => {
  const container_block = createBlock({
    id: 'my_box',
    type: 'Box',
    eval: { slots: { content: { gap: 16 } } },
  });
  const children = [createBlock({ id: 'one', eval: { skeleton: { id: 's1', type: 'Skeleton' } } })];
  const { container } = renderBlock({
    block: container_block,
    Blocks: createBlocks(container_block, children),
    loading: true,
  });
  expect(container.querySelectorAll('.lf-row')).toHaveLength(1);
  expect(container.querySelector('.lf-col').id).toBe('s-bl-one-s1');
});
