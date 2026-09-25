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

function createAppCounters() {
  return {
    actions: createCounter(),
    blocks: createCounter(),
    requests: createCounter(),
    operators: { client: createCounter(), server: createCounter() },
  };
}

test('createPageTypeCounters records client types per page and still counts app-wide', () => {
  const appCounters = createAppCounters();
  const { pageCounters, typeCounters } = createPageTypeCounters({ typeCounters: appCounters });
  typeCounters.blocks.increment('Button');
  typeCounters.actions.increment('SetState');
  typeCounters.operators.client.increment('_state');
  typeCounters.operators.server.increment('_secret');
  typeCounters.requests.increment('MongoDBFind');
  expect(pageCounters.blocks.getCounts()).toEqual({ Button: 1 });
  expect(pageCounters.actions.getCounts()).toEqual({ SetState: 1 });
  expect(pageCounters.operators.getCounts()).toEqual({ _state: 1 });
  expect(appCounters.blocks.getCounts()).toEqual({ Button: 1 });
  expect(appCounters.actions.getCounts()).toEqual({ SetState: 1 });
  expect(appCounters.operators.client.getCounts()).toEqual({ _state: 1 });
  expect(appCounters.operators.server.getCounts()).toEqual({ _secret: 1 });
  expect(appCounters.requests.getCounts()).toEqual({ MongoDBFind: 1 });
});

test('createPageTypeCounters keeps pages separate', () => {
  const appCounters = createAppCounters();
  const first = createPageTypeCounters({ typeCounters: appCounters });
  const second = createPageTypeCounters({ typeCounters: appCounters });
  first.typeCounters.blocks.increment('Button');
  second.typeCounters.blocks.increment('Card');
  expect(first.pageCounters.blocks.getCounts()).toEqual({ Button: 1 });
  expect(second.pageCounters.blocks.getCounts()).toEqual({ Card: 1 });
  expect(appCounters.blocks.getCounts()).toEqual({ Button: 1, Card: 1 });
});
