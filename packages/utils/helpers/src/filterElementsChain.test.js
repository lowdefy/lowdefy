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

import filterElementsChain from './filterElementsChain.js';
import parseElementsChain from './parseElementsChain.js';
import targetFromElementsChain from './targetFromElementsChain.js';

function escape(value) {
  return String(value).replace(/"|\\"/g, '\\"');
}

// One chain entry as posthog-js writes it: `tag.classes:` then the attributes sorted by key.
function entry(tag, { classes = [], attributes = {}, text } = {}) {
  const all = { 'nth-child': 1, 'nth-of-type': 1, ...attributes };
  if (classes.length > 0) {
    all.attr__class = classes.join(' ');
  }
  if (attributes.attr__id) {
    all.attr_id = attributes.attr__id;
  }
  if (text) {
    all.text = text;
  }
  const pairs = Object.keys(all)
    .sort()
    .map((key) => `${escape(key)}="${escape(all[key])}"`)
    .join('');
  return `${[tag, ...[...classes].sort()].join('.')}:${pairs}`;
}

function wrapper(blockId) {
  return entry('div', { attributes: { attr__id: `bl-${blockId}` } });
}

function chain(...entries) {
  return entries.join(';');
}

const STRUCTURAL_KEYS = [
  'attr__class',
  'attr__col-id',
  'attr__id',
  'attr__role',
  'attr__row-index',
  'attr__type',
  'attr_id',
  'nth-child',
  'nth-of-type',
];

function keepAll({ value }) {
  return value;
}

// The masking the PostHog plugin applies: structural keys stay, text stays when kept, an href is
// emptied, everything else goes.
function maskWith(keptTexts) {
  return function filterAttribute({ key, value }) {
    if (STRUCTURAL_KEYS.includes(key)) {
      return value;
    }
    if (key === 'text') {
      return keptTexts.includes(value) ? value : null;
    }
    if (key === 'href' || key === 'attr__href') {
      return keptTexts.includes(value) ? value : '';
    }
    return null;
  };
}

const WELL_FORMED_CHAINS = [
  '',
  'div',
  'div:',
  'div:;span:',
  chain(
    entry('span', { text: 'Save' }),
    entry('button', { classes: ['ant-btn', 'ant-btn-primary'], text: 'Save' }),
    wrapper('save_button'),
    wrapper('page')
  ),
  chain(
    entry('button', { text: 'Edit' }),
    entry('div', { classes: ['ag-cell'], attributes: { 'attr__col-id': 'actions' } }),
    entry('div', { classes: ['ag-row'], attributes: { 'attr__row-index': '3' } }),
    wrapper('grid')
  ),
  chain(
    entry('div', {
      classes: ['ant-select-item', 'ant-select-item-option'],
      attributes: { attr__role: 'option', attr__title: 'Jane Customer' },
      text: 'Jane Customer',
    }),
    wrapper('customer')
  ),
  chain(entry('button', { text: 'Say "hi"; then go' }), wrapper('greet')),
  chain(entry('button', { classes: ['md:flex', 'px-2'], text: 'Go' }), wrapper('go')),
  chain(
    entry('a', { attributes: { href: '/orders/1', attr__href: '/orders/1' }, text: 'Order 1' }),
    wrapper('link')
  ),
];

test.each(WELL_FORMED_CHAINS.map((value) => [value]))(
  'filterElementsChain returns the chain byte for byte when every attribute is kept: %s',
  (value) => {
    expect(filterElementsChain({ chain: value, filterAttribute: keepAll })).toBe(value);
  }
);

test('filterElementsChain calls filterAttribute with every key and unescaped value', () => {
  const value = chain(entry('button', { text: 'Say "hi"' }), wrapper('greet'));
  const calls = [];
  filterElementsChain({
    chain: value,
    filterAttribute: (pair) => {
      calls.push(pair);
      return pair.value;
    },
  });
  expect(calls).toEqual([
    { key: 'nth-child', value: '1' },
    { key: 'nth-of-type', value: '1' },
    { key: 'text', value: 'Say "hi"' },
    { key: 'attr__id', value: 'bl-greet' },
    { key: 'attr_id', value: 'bl-greet' },
    { key: 'nth-child', value: '1' },
    { key: 'nth-of-type', value: '1' },
  ]);
});

test('filterElementsChain drops the pairs filterAttribute returns null for and leaves the rest', () => {
  const value = chain(
    entry('div', {
      classes: ['ant-select-item', 'ant-select-item-option'],
      attributes: {
        attr__role: 'option',
        attr__title: 'Jane Customer',
        'attr__aria-label': 'Jane',
      },
      text: 'Jane Customer',
    }),
    wrapper('customer')
  );
  const filtered = filterElementsChain({ chain: value, filterAttribute: maskWith([]) });
  expect(filtered).toBe(
    chain(
      entry('div', {
        classes: ['ant-select-item', 'ant-select-item-option'],
        attributes: { attr__role: 'option' },
      }),
      wrapper('customer')
    )
  );
  expect(filtered).not.toContain('Jane');
});

test('filterElementsChain replaces a value with the string filterAttribute returns, escaped', () => {
  const value = chain(
    entry('a', { attributes: { href: '/orders/1', attr__href: '/orders/1' }, text: 'Open' }),
    wrapper('link')
  );
  expect(
    filterElementsChain({
      chain: value,
      filterAttribute: ({ key, value: current }) => (key === 'text' ? 'Say "hi"' : current),
    })
  ).toBe(
    chain(
      entry('a', { attributes: { href: '/orders/1', attr__href: '/orders/1' }, text: 'Say "hi"' }),
      wrapper('link')
    )
  );
  expect(filterElementsChain({ chain: value, filterAttribute: maskWith(['Open']) })).toBe(
    chain(entry('a', { attributes: { href: '', attr__href: '' }, text: 'Open' }), wrapper('link'))
  );
});

test('filterElementsChain keeps a class part that holds a colon', () => {
  const value = chain(entry('button', { classes: ['md:flex', 'px-2'], text: 'Go' }), wrapper('go'));
  expect(filterElementsChain({ chain: value, filterAttribute: maskWith([]) })).toBe(
    chain(entry('button', { classes: ['md:flex', 'px-2'] }), wrapper('go'))
  );
});

test('filterElementsChain removes text holding escaped quotes and semicolons without breaking entries', () => {
  const value = chain(entry('button', { text: 'Say "hi"; then go' }), wrapper('greet'));
  const filtered = filterElementsChain({ chain: value, filterAttribute: maskWith([]) });
  expect(filtered).toBe(chain(entry('button'), wrapper('greet')));
  expect(parseElementsChain(filtered)).toHaveLength(2);
});

test('filterElementsChain drops a malformed tail it cannot read', () => {
  expect(
    filterElementsChain({ chain: 'div:attr__id="bl-a"garbage', filterAttribute: keepAll })
  ).toBe('div:attr__id="bl-a"');
  [';;;', ':', 'div:attr__id', 'div:attr__id="', '\\"\\"\\"', 'div:text="\\'].forEach((value) => {
    expect(() => filterElementsChain({ chain: value, filterAttribute: keepAll })).not.toThrow();
  });
});

test('targetFromElementsChain reads block, row, column and option from a masked chain, with no text', () => {
  const gridChain = chain(
    entry('div', { classes: ['ag-cell'], attributes: { 'attr__col-id': 'name' }, text: 'Jane' }),
    entry('div', { classes: ['ag-row'], attributes: { 'attr__row-index': '3' } }),
    wrapper('grid'),
    wrapper('page')
  );
  expect(
    targetFromElementsChain(
      filterElementsChain({ chain: gridChain, filterAttribute: maskWith([]) })
    )
  ).toEqual({
    block_id: 'grid',
    row: 3,
    column: 'name',
    text: null,
    option: false,
    block_ids: ['grid', 'page'],
  });
  const optionChain = chain(
    entry('div', { classes: ['ant-select-item-option-content'], text: 'Jane Customer' }),
    entry('div', {
      classes: ['ant-select-item', 'ant-select-item-option'],
      attributes: { attr__role: 'option', attr__title: 'Jane Customer' },
    }),
    wrapper('customer')
  );
  expect(
    targetFromElementsChain(
      filterElementsChain({ chain: optionChain, filterAttribute: maskWith([]) })
    )
  ).toEqual({
    block_id: 'customer',
    row: null,
    column: null,
    text: null,
    option: true,
    block_ids: ['customer'],
  });
});

test('targetFromElementsChain keeps a config text and a link on a masked chain', () => {
  const value = chain(
    entry('a', { attributes: { href: '/x/1', attr__href: '/x/1' }, text: 'Assign' }),
    wrapper('row_actions')
  );
  expect(
    targetFromElementsChain(
      filterElementsChain({ chain: value, filterAttribute: maskWith(['Assign']) })
    )
  ).toMatchObject({ block_id: 'row_actions', text: 'Assign' });
});
