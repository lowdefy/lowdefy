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

import createCounter from '../../utils/createCounter.js';
import createPageTypeCounters from './createPageTypeCounters.js';

function makeTypeCounters() {
  return {
    actions: createCounter(),
    blocks: createCounter(),
    operators: { client: createCounter(), server: createCounter() },
  };
}

test('createPageTypeCounters records the types incremented for one page', () => {
  const typeCounters = makeTypeCounters();
  const pageTypeCounters = createPageTypeCounters({ typeCounters });
  pageTypeCounters.counters.blocks.increment('Button', 'key1');
  pageTypeCounters.counters.actions.increment('Link', 'key2');
  pageTypeCounters.counters.operators.client.increment('_state', 'key3');
  expect(pageTypeCounters.types).toEqual({
    actions: new Set(['Link']),
    blocks: new Set(['Button']),
    operators: new Set(['_state']),
  });
});

test('createPageTypeCounters still counts into the app-wide counters', () => {
  const typeCounters = makeTypeCounters();
  const pageTypeCounters = createPageTypeCounters({ typeCounters });
  pageTypeCounters.counters.blocks.increment('Button', 'key1');
  pageTypeCounters.counters.blocks.increment('Button', 'key2');
  expect(typeCounters.blocks.getCounts()).toEqual({ Button: 2 });
  expect(typeCounters.blocks.getLocation('Button')).toEqual('key1');
});

test('createPageTypeCounters does not record server operators as page types', () => {
  const typeCounters = makeTypeCounters();
  const pageTypeCounters = createPageTypeCounters({ typeCounters });
  pageTypeCounters.counters.operators.server.increment('_secret', 'key1');
  expect(pageTypeCounters.types.operators).toEqual(new Set());
  expect(typeCounters.operators.server.getCounts()).toEqual({ _secret: 1 });
});

test('createPageTypeCounters keeps each page type set separate', () => {
  const typeCounters = makeTypeCounters();
  const pageOne = createPageTypeCounters({ typeCounters });
  const pageTwo = createPageTypeCounters({ typeCounters });
  pageOne.counters.blocks.increment('Button', 'key1');
  pageTwo.counters.blocks.increment('Card', 'key2');
  expect(pageOne.types.blocks).toEqual(new Set(['Button']));
  expect(pageTwo.types.blocks).toEqual(new Set(['Card']));
});
