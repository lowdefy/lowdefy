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

import assert from 'node:assert/strict';
import test from 'node:test';

import initAggregates from './initAggregates.js';
import initCollapsedGroups from './initCollapsedGroups.js';
import initGrouping from './initGrouping.js';

const config = {
  columnsByKey: new Map([
    ['region', { key: 'region', groupable: true }],
    ['rep', { key: 'rep', groupable: true }],
    ['name', { key: 'name', groupable: false }],
    ['amount', { key: 'amount', groupable: false }],
  ]),
};

test('initGrouping reads the value group, then defaultView', () => {
  assert.deepEqual(
    initGrouping({ value: { view: { group: [{ key: 'rep' }] } }, defaultView: {}, config }),
    ['rep']
  );
  assert.deepEqual(
    initGrouping({ value: null, defaultView: { group: [{ key: 'region' }] }, config }),
    ['region']
  );
  assert.deepEqual(initGrouping({ value: null, defaultView: {}, config }), []);
});

test('initGrouping drops unknown, non-groupable and repeated keys', () => {
  assert.deepEqual(
    initGrouping({
      value: {
        view: {
          group: [{ key: 'region' }, { key: 'name' }, { key: 'gone' }, { key: 'region' }, 'rep'],
        },
      },
      defaultView: {},
      config,
    }),
    ['region', 'rep']
  );
});

test('initCollapsedGroups keeps string keys only', () => {
  assert.deepEqual(
    initCollapsedGroups({
      value: { view: { collapsedGroups: ['["EMEA"]', 3, null, '[null]'] } },
      defaultView: {},
    }),
    ['["EMEA"]', '[null]']
  );
  assert.deepEqual(initCollapsedGroups({ value: null, defaultView: {} }), []);
});

test('initAggregates keeps known columns with known functions or null', () => {
  assert.deepEqual(
    initAggregates({
      value: null,
      defaultView: {
        aggregates: { amount: 'sum', name: null, gone: 'sum', rep: 'median', region: 'count' },
      },
      config,
    }),
    { amount: 'sum', name: null, region: 'count' }
  );
  assert.deepEqual(initAggregates({ value: null, defaultView: {}, config }), {});
});
