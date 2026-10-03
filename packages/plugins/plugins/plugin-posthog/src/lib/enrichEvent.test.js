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

import enrichEvent from './enrichEvent.js';
import postHogState from './postHogState.js';
import createFakeTrace from '../test/createFakeTrace.js';
import resetPostHogState from '../test/resetPostHogState.js';

const CHAIN = 'button:nth-child="1"nth-of-type="1"text="Save"';

function target(fields) {
  return {
    page_id: 'orders',
    block_id: null,
    block_type: null,
    row: null,
    column: null,
    text: null,
    nth: null,
    option: false,
    block_ids: [],
    ...fields,
  };
}

function useTrace(described) {
  postHogState.trace = createFakeTrace({
    describeChain: () => described,
    pageIdOf: (url) => new URL(url).pathname.slice(1) || null,
  });
  return postHogState.trace;
}

beforeEach(() => {
  resetPostHogState();
});

test.each(['$autocapture', '$rageclick', '$dead_click'])(
  'enrichEvent stamps the block a %s hit',
  (name) => {
    const trace = useTrace(
      target({ block_id: 'save_button', block_type: 'Button', block_ids: ['save_button', 'card'] })
    );
    const event = {
      event: name,
      properties: { $current_url: 'https://example.com/orders', $elements_chain: CHAIN },
    };
    expect(enrichEvent(event)).toBe(event);
    expect(trace.describeChain).toHaveBeenCalledWith(CHAIN);
    expect(event.properties).toEqual({
      $current_url: 'https://example.com/orders',
      $elements_chain: CHAIN,
      lowdefy_page_id: 'orders',
      lowdefy_block_id: 'save_button',
      lowdefy_block_type: 'Button',
      lowdefy_block_ids: ['save_button', 'card'],
    });
  }
);

test('enrichEvent stamps the grid row and column, keeping row 0', () => {
  useTrace(target({ block_id: 'grid', row: 0, column: 'actions', block_ids: ['grid'] }));
  const event = { event: '$autocapture', properties: { $elements_chain: CHAIN } };
  enrichEvent(event);
  expect(event.properties).toMatchObject({ lowdefy_row: 0, lowdefy_column: 'actions' });
});

test('enrichEvent marks a dropdown option', () => {
  useTrace(target({ block_id: 'country', option: true, block_ids: ['country'] }));
  const event = { event: '$autocapture', properties: { $elements_chain: CHAIN } };
  enrichEvent(event);
  expect(event.properties.lowdefy_option).toBe(true);
});

test('enrichEvent leaves out null, false and empty fields and never the text', () => {
  useTrace(target({ page_id: null, text: 'Save' }));
  const event = { event: '$autocapture', properties: { $elements_chain: CHAIN } };
  enrichEvent(event);
  expect(event.properties).toEqual({ $elements_chain: CHAIN });
});

test('enrichEvent gives every other event the page id from its URL', () => {
  const trace = useTrace(target({}));
  const event = {
    event: '$pageview',
    properties: { $current_url: 'https://example.com/orders' },
  };
  enrichEvent(event);
  expect(event.properties.lowdefy_page_id).toBe('orders');
  expect(trace.describeChain).not.toHaveBeenCalled();
});

test('enrichEvent keeps a page id an event already carries', () => {
  useTrace(target({}));
  const event = {
    event: 'lowdefy_event_failed',
    properties: { $current_url: 'https://example.com/other', lowdefy_page_id: 'orders' },
  };
  enrichEvent(event);
  expect(event.properties.lowdefy_page_id).toBe('orders');
});

test('enrichEvent leaves an event without a URL or page unchanged', () => {
  useTrace(target({}));
  const noUrl = { event: '$snapshot', properties: { $snapshot_data: [] } };
  const root = { event: '$pageview', properties: { $current_url: 'https://example.com/' } };
  enrichEvent(noUrl);
  enrichEvent(root);
  expect(noUrl.properties).toEqual({ $snapshot_data: [] });
  expect(root.properties).toEqual({ $current_url: 'https://example.com/' });
});

test('enrichEvent does not describe an autocapture event without a chain', () => {
  const trace = useTrace(target({}));
  const event = { event: '$autocapture', properties: { $current_url: 'https://example.com/a' } };
  enrichEvent(event);
  expect(trace.describeChain).not.toHaveBeenCalled();
  expect(event.properties.lowdefy_page_id).toBe('a');
});
