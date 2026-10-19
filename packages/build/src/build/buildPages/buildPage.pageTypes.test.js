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

import buildPages from '../full/buildPages.js';
import testContext from '../../test-utils/testContext.js';

test('buildPages records the client types each page uses, including subscriptions', () => {
  const context = testContext({ logger: { warn: () => {}, log: () => {} } });
  context.websocketIds.add('orders');
  const components = {
    pages: [
      {
        id: 'first',
        type: 'Box',
        auth: { public: true },
        blocks: [
          {
            id: 'save',
            type: 'Button',
            events: { onClick: [{ id: 'set', type: 'SetState', params: { saved: true } }] },
          },
        ],
        subscriptions: [{ websocketId: 'orders', payload: { since: { _date: 'now' } } }],
      },
      {
        id: 'second',
        type: 'Card',
        auth: { public: true },
        properties: { title: { _state: 'title' } },
      },
    ],
  };
  buildPages({ components, context });
  const first = context.pageTypeCounters.get('first');
  const second = context.pageTypeCounters.get('second');
  expect(Object.keys(first.blocks.getCounts()).sort()).toEqual(['Box', 'Button']);
  expect(Object.keys(first.actions.getCounts())).toEqual(['SetState']);
  expect(Object.keys(first.operators.getCounts())).toEqual(['_date']);
  expect(Object.keys(second.blocks.getCounts())).toEqual(['Card']);
  expect(Object.keys(second.operators.getCounts())).toEqual(['_state']);
  expect(Object.keys(context.typeCounters.blocks.getCounts()).sort()).toEqual([
    'Box',
    'Button',
    'Card',
  ]);
});

test('buildPages adds the types a page runs without naming them to its own set', () => {
  const context = testContext({ logger: { warn: () => {}, log: () => {} } });
  context.blockMetas = { Upload: { category: 'input', actions: ['Request'] } };
  const components = {
    pages: [
      {
        id: 'files',
        type: 'Box',
        auth: { public: true },
        blocks: [{ id: 'upload', type: 'Upload' }],
      },
      {
        id: 'script',
        type: 'Box',
        auth: { public: true },
        properties: { title: { _js: 'return state("name");' } },
      },
    ],
  };
  buildPages({ components, context });
  const files = context.pageTypeCounters.get('files');
  const script = context.pageTypeCounters.get('script');
  expect(Object.keys(files.actions.getCounts())).toEqual(['Request']);
  expect(Object.keys(script.operators.getCounts())).toEqual(
    expect.arrayContaining(['_js', '_state', '_request', '_url_query'])
  );
  expect(Object.keys(script.actions.getCounts())).toEqual([]);
});
