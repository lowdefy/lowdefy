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

import { jest } from '@jest/globals';
import { targetFromElementsChain } from '@lowdefy/helpers';

import maskEventText from './maskEventText.js';
import createFakeTrace from '../test/createFakeTrace.js';

const CONFIG_TEXTS = ['Assign', 'Customer name', 'Active', '/orders'];

function mask(
  properties,
  { event = '$autocapture', trace = createFakeTrace({ configTexts: CONFIG_TEXTS }) } = {}
) {
  return maskEventText({ event: { event, properties }, trace, pageId: 'orders' });
}

// A grid row: a literal "Assign" button and a data cell, inside the grid block.
const GRID_CHAIN = [
  'span:nth-child="1"nth-of-type="1"text="Assign"',
  'button.ant-btn:attr__type="button"nth-child="1"nth-of-type="1"text="Assign"',
  'div.ag-cell:attr__col-id="actions"attr__role="gridcell"nth-child="2"nth-of-type="2"',
  'div.ag-row:attr__aria-label="Jane Customer"attr__row-index="4"attr__role="row"nth-child="5"nth-of-type="5"',
  'div:attr__data-owner="jane@example.com"attr__id="bl-grid"attr_id="bl-grid"nth-child="1"nth-of-type="1"',
].join(';');

const MASKED_GRID_CHAIN = [
  'span:nth-child="1"nth-of-type="1"text="Assign"',
  'button.ant-btn:attr__type="button"nth-child="1"nth-of-type="1"text="Assign"',
  'div.ag-cell:attr__col-id="actions"attr__role="gridcell"nth-child="2"nth-of-type="2"',
  'div.ag-row:attr__row-index="4"attr__role="row"nth-child="5"nth-of-type="5"',
  'div:attr__id="bl-grid"attr_id="bl-grid"nth-child="1"nth-of-type="1"',
].join(';');

// An antd select option filled by a request: its label is in the text and the title.
const OPTION_CHAIN = [
  'div.ant-select-item-option-content:nth-child="1"nth-of-type="1"text="Jane Customer"',
  'div.ant-select-item.ant-select-item-option:attr__aria-selected="false"attr__class="ant-select-item ant-select-item-option"attr__title="Jane Customer"nth-child="3"nth-of-type="3"',
  'div:attr__id="bl-customer"attr_id="bl-customer"nth-child="1"nth-of-type="1"',
].join(';');

const MASKED_OPTION_CHAIN = [
  'div.ant-select-item-option-content:nth-child="1"nth-of-type="1"',
  'div.ant-select-item.ant-select-item-option:attr__class="ant-select-item ant-select-item-option"nth-child="3"nth-of-type="3"',
  'div:attr__id="bl-customer"attr_id="bl-customer"nth-child="1"nth-of-type="1"',
].join(';');

test('maskEventText keeps config text entries, removes data text and leaves the rest of the chain byte for byte', () => {
  const event = mask({ $elements_chain: GRID_CHAIN, $el_text: 'Assign' });
  expect(event.properties).toEqual({ $elements_chain: MASKED_GRID_CHAIN, $el_text: 'Assign' });
});

test('maskEventText removes a data text entry and a data $el_text', () => {
  const chain =
    'td:nth-child="2"nth-of-type="2"text="Jane Customer";div:attr__id="bl-table"nth-child="1"nth-of-type="1"';
  const event = mask({ $elements_chain: chain, $el_text: 'Jane Customer' });
  expect(event.properties).toEqual({
    $elements_chain:
      'td:nth-child="2"nth-of-type="2";div:attr__id="bl-table"nth-child="1"nth-of-type="1"',
  });
});

test('maskEventText removes the title and aria-label of a select option and keeps its structure', () => {
  const event = mask({ $elements_chain: OPTION_CHAIN, $el_text: 'Jane Customer' });
  expect(event.properties).toEqual({ $elements_chain: MASKED_OPTION_CHAIN });
  expect(JSON.stringify(event)).not.toContain('Jane');
});

test('maskEventText keeps row-index, col-id, the bl- id and nth-child', () => {
  const { properties } = mask({ $elements_chain: GRID_CHAIN });
  expect(properties.$elements_chain).toContain('attr__row-index="4"');
  expect(properties.$elements_chain).toContain('attr__col-id="actions"');
  expect(properties.$elements_chain).toContain('attr__id="bl-grid"');
  expect(properties.$elements_chain).toContain('nth-child="5"');
  expect(properties.$elements_chain).not.toContain('Jane');
  expect(properties.$elements_chain).not.toContain('jane@example.com');
});

test('maskEventText leaves a masked chain that still targets the block, row, column and option', () => {
  expect(
    targetFromElementsChain(mask({ $elements_chain: GRID_CHAIN }).properties.$elements_chain)
  ).toEqual({
    block_id: 'grid',
    row: 4,
    column: 'actions',
    text: 'Assign',
    option: false,
    block_ids: ['grid'],
  });
  expect(
    targetFromElementsChain(mask({ $elements_chain: OPTION_CHAIN }).properties.$elements_chain)
  ).toEqual({
    block_id: 'customer',
    row: null,
    column: null,
    text: null,
    option: true,
    block_ids: ['customer'],
  });
});

// A tab keyed by record inside a Tabs block, then a submenu popup keyed by record: library ids
// that embed runtime keys.
const ID_CHAIN = [
  'div.ant-tabs-tab-btn:attr__aria-selected="true"attr__id="rc-tabs-0-tab-Jane Customer"attr__role="tab"attr_id="rc-tabs-0-tab-Jane Customer"nth-child="1"nth-of-type="1"text="Assign"',
  'div.ant-tabs-tab:nth-child="2"nth-of-type="2"',
  'div:attr__id="bl-tabs"attr_id="bl-tabs"nth-child="1"nth-of-type="1"',
].join(';');

const MASKED_ID_CHAIN = [
  'div.ant-tabs-tab-btn:attr__role="tab"nth-child="1"nth-of-type="1"text="Assign"',
  'div.ant-tabs-tab:nth-child="2"nth-of-type="2"',
  'div:attr__id="bl-tabs"attr_id="bl-tabs"nth-child="1"nth-of-type="1"',
].join(';');

const SUBMENU_CHAIN = [
  'li.ant-menu-item:attr__role="menuitem"nth-child="1"nth-of-type="1"text="Active"',
  'ul.ant-menu.ant-menu-sub:attr__id="rc-menu-uuid-1-acme-popup"attr__role="menu"attr_id="rc-menu-uuid-1-acme-popup"nth-child="1"nth-of-type="1"',
  'div:attr__id="bl-menu"attr_id="bl-menu"nth-child="1"nth-of-type="1"',
].join(';');

test('maskEventText removes library ids that embed runtime keys and keeps block wrapper ids', () => {
  expect(mask({ $elements_chain: ID_CHAIN }).properties.$elements_chain).toBe(MASKED_ID_CHAIN);
  const { properties } = mask({ $elements_chain: SUBMENU_CHAIN });
  expect(properties.$elements_chain).toBe(
    [
      'li.ant-menu-item:attr__role="menuitem"nth-child="1"nth-of-type="1"text="Active"',
      'ul.ant-menu.ant-menu-sub:attr__role="menu"nth-child="1"nth-of-type="1"',
      'div:attr__id="bl-menu"attr_id="bl-menu"nth-child="1"nth-of-type="1"',
    ].join(';')
  );
  expect(properties.$elements_chain).not.toContain('acme');
});

test('maskEventText keeps classes, row-index, col-id and bl- ids byte for byte while dropping other ids', () => {
  const chain = [
    'div.ant-select-item.ant-select-item-option:attr__class="ant-select-item ant-select-item-option"attr__id="customer_list_3"attr__role="option"attr_id="customer_list_3"nth-child="3"nth-of-type="3"',
    'div.ag-row:attr__row-index="4"attr__role="row"nth-child="5"nth-of-type="5"',
    'div.ag-cell:attr__col-id="name"attr__role="gridcell"nth-child="2"nth-of-type="2"',
    'div:attr__id="bl-grid"attr_id="bl-grid"nth-child="1"nth-of-type="1"',
  ].join(';');
  expect(mask({ $elements_chain: chain }).properties.$elements_chain).toBe(
    chain.replace(/attr__id="customer_list_3"/, '').replace(/attr_id="customer_list_3"/, '')
  );
});

test('maskEventText removes a non-block id from an $elements entry and keeps a bl- id', () => {
  const { properties } = mask({
    $elements: [
      {
        tag_name: 'div',
        classes: ['ant-tabs-tab-btn'],
        attr__id: 'rc-tabs-0-tab-Jane Customer',
        attr_id: 'rc-tabs-0-tab-Jane Customer',
        attr__role: 'tab',
        nth_child: 1,
        nth_of_type: 1,
      },
      { tag_name: 'div', attr__id: 'bl-tabs', attr_id: 'bl-tabs', nth_child: 1, nth_of_type: 1 },
    ],
  });
  expect(properties.$elements).toEqual([
    {
      tag_name: 'div',
      classes: ['ant-tabs-tab-btn'],
      attr__role: 'tab',
      nth_child: 1,
      nth_of_type: 1,
    },
    { tag_name: 'div', attr__id: 'bl-tabs', attr_id: 'bl-tabs', nth_child: 1, nth_of_type: 1 },
  ]);
});

test('maskEventText leaves targetFromElementsChain unchanged apart from text when ids are dropped', () => {
  [GRID_CHAIN, OPTION_CHAIN, ID_CHAIN, SUBMENU_CHAIN].forEach((chain) => {
    const { block_id, block_ids, row, column, option } = targetFromElementsChain(chain);
    expect(
      targetFromElementsChain(mask({ $elements_chain: chain }).properties.$elements_chain)
    ).toEqual(expect.objectContaining({ block_id, block_ids, row, column, option }));
  });
});

test('maskEventText empties a failing href and keeps a config href', () => {
  const chain =
    'a:attr__href="/customers/jane"href="/customers/jane"nth-child="1"nth-of-type="1"text="Jane Customer";a:attr__href="/orders"href="/orders"nth-child="2"nth-of-type="2"text="Assign"';
  const { properties } = mask({ $elements_chain: chain });
  expect(properties.$elements_chain).toBe(
    'a:attr__href=""href=""nth-child="1"nth-of-type="1";a:attr__href="/orders"href="/orders"nth-child="2"nth-of-type="2"text="Assign"'
  );
});

test('maskEventText removes a failing $external_click_url and $selected_content and keeps passing ones', () => {
  expect(
    mask(
      { $external_click_url: 'https://crm.example.com/jane', $selected_content: 'Jane Customer' },
      { event: '$copy_autocapture' }
    ).properties
  ).toEqual({});
  expect(
    mask(
      { $external_click_url: '/orders', $selected_content: 'Active' },
      { event: '$copy_autocapture' }
    ).properties
  ).toEqual({ $external_click_url: '/orders', $selected_content: 'Active' });
});

test.each(['$dead_click', '$dead_swipe', '$rageclick', '$future_click_event'])(
  'maskEventText masks the chain and $elements of a %s',
  (name) => {
    const { properties } = mask(
      {
        $elements_chain: OPTION_CHAIN,
        $elements: [
          {
            tag_name: 'div',
            $el_text: 'Jane Customer',
            classes: ['ant-select-item-option-content'],
            nth_child: 1,
            nth_of_type: 1,
          },
          {
            tag_name: 'div',
            classes: ['ant-select-item', 'ant-select-item-option'],
            attr__class: 'ant-select-item ant-select-item-option',
            attr__title: 'Jane Customer',
            'attr__data-id': 'cust_42',
            attr__role: 'option',
            nth_child: 3,
            nth_of_type: 3,
          },
          {
            tag_name: 'a',
            attr__href: '/customers/jane',
            $el_text: 'Assign',
            nth_child: 1,
            nth_of_type: 1,
          },
        ],
        $el_text: 'Jane Customer',
        lowdefy_block_id: 'customer',
        lowdefy_option: true,
      },
      { event: name }
    );
    expect(properties).toEqual({
      $elements_chain: MASKED_OPTION_CHAIN,
      $elements: [
        {
          tag_name: 'div',
          classes: ['ant-select-item-option-content'],
          nth_child: 1,
          nth_of_type: 1,
        },
        {
          tag_name: 'div',
          classes: ['ant-select-item', 'ant-select-item-option'],
          attr__class: 'ant-select-item ant-select-item-option',
          attr__role: 'option',
          nth_child: 3,
          nth_of_type: 3,
        },
        { tag_name: 'a', attr__href: '', $el_text: 'Assign', nth_child: 1, nth_of_type: 1 },
      ],
      lowdefy_block_id: 'customer',
      lowdefy_option: true,
    });
  }
);

test('maskEventText leaves lowdefy_* properties, URLs and an event without text alone', () => {
  const properties = {
    $current_url: 'https://example.com/customers/jane',
    $pathname: '/customers/jane',
    lowdefy_page_id: 'customer',
    lowdefy_path_params: { name: 'jane' },
    lowdefy_row: 0,
  };
  expect(mask({ ...properties }, { event: '$pageview' }).properties).toEqual(properties);
});

test('maskEventText asks isConfigText with the page id', () => {
  const trace = createFakeTrace({ configTexts: CONFIG_TEXTS });
  maskEventText({
    event: { event: '$autocapture', properties: { $el_text: 'Assign' } },
    trace,
    pageId: 'orders',
  });
  expect(trace.isConfigText).toHaveBeenCalledWith({ text: 'Assign', pageId: 'orders' });
});

test('maskEventText strips every text and non-structural attribute and still returns the event when isConfigText throws', () => {
  const trace = createFakeTrace({
    isConfigText: () => {
      throw new Error('config text failed');
    },
  });
  const event = {
    event: '$autocapture',
    properties: {
      $elements_chain: GRID_CHAIN,
      $elements: [
        { tag_name: 'button', $el_text: 'Assign', attr__title: 'Jane', nth_child: 1 },
        { tag_name: 'div', attr__id: 'rc-tabs-0-tab-Jane', nth_child: 1 },
        { tag_name: 'div', attr__id: 'bl-grid', attr_id: 'bl-grid', nth_child: 1 },
      ],
      $el_text: 'Assign',
      $selected_content: 'Assign',
      lowdefy_block_id: 'grid',
    },
  };
  expect(maskEventText({ event, trace, pageId: 'orders' })).toBe(event);
  expect(event.properties).toEqual({
    $elements_chain: MASKED_GRID_CHAIN.replace(/text="Assign"/g, ''),
    $elements: [
      { tag_name: 'button', nth_child: 1 },
      { tag_name: 'div', nth_child: 1 },
      { tag_name: 'div', attr__id: 'bl-grid', attr_id: 'bl-grid', nth_child: 1 },
    ],
    lowdefy_block_id: 'grid',
  });
});

test('maskEventText does not call a throwing isConfigText again after it failed', () => {
  const isConfigText = jest.fn(() => {
    throw new Error('config text failed');
  });
  const trace = createFakeTrace({ isConfigText });
  maskEventText({
    event: { event: '$autocapture', properties: { $el_text: 'a', $selected_content: 'b' } },
    trace,
    pageId: null,
  });
  expect(isConfigText).toHaveBeenCalledTimes(1);
});
