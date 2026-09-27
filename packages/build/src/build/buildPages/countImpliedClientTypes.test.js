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

import { _js } from '@lowdefy/operators-js/operators/client';

import countImpliedClientTypes from './countImpliedClientTypes.js';
import createCounter from '../../utils/createCounter.js';
import createPageTypeCounters from './createPageTypeCounters.js';
import jsAccessorOperators from '../jsAccessorOperators.js';

function setup() {
  const appCounters = {
    actions: createCounter(),
    blocks: createCounter(),
    operators: { client: createCounter(), server: createCounter() },
  };
  return { appCounters, ...createPageTypeCounters({ typeCounters: appCounters }) };
}

const blockMetas = {
  Upload: { category: 'input', actions: ['Request'] },
  AgentChat: { category: 'display', actions: ['Request', 'SetState'], operators: ['_event'] },
  Button: { category: 'display' },
};

test.each([
  {
    name: 'a block that registers its own events',
    blocks: ['Upload'],
    operators: [],
    actions: ['Request'],
    impliedOperators: [],
  },
  {
    name: 'a block that registers actions and operators',
    blocks: ['AgentChat', 'Button'],
    operators: [],
    actions: ['Request', 'SetState'],
    impliedOperators: ['_event'],
  },
  {
    name: 'a page that runs _js',
    blocks: ['Button'],
    operators: ['_js'],
    actions: [],
    impliedOperators: ['_js', ...jsAccessorOperators],
  },
  {
    name: 'a page with neither',
    blocks: ['Button', 'Unknown'],
    operators: ['_if'],
    actions: [],
    impliedOperators: ['_if'],
  },
])(
  'countImpliedClientTypes counts implied types into the page and app sets: $name',
  ({ blocks, operators, actions, impliedOperators }) => {
    const { appCounters, pageCounters, typeCounters } = setup();
    blocks.forEach((blockType) => typeCounters.blocks.increment(blockType));
    operators.forEach((operator) => typeCounters.operators.client.increment(operator));

    countImpliedClientTypes({ blockMetas, pageCounters, typeCounters });

    [pageCounters.actions, appCounters.actions].forEach((counter) =>
      expect(Object.keys(counter.getCounts()).sort()).toEqual([...actions].sort())
    );
    [pageCounters.operators, appCounters.operators.client].forEach((counter) =>
      expect(Object.keys(counter.getCounts()).sort()).toEqual([...impliedOperators].sort())
    );
  }
);

test('countImpliedClientTypes points implied types at the block that needs them', () => {
  const { appCounters, pageCounters, typeCounters } = setup();
  typeCounters.blocks.increment('Upload', 'upload-key');
  countImpliedClientTypes({ blockMetas, pageCounters, typeCounters });
  expect(appCounters.actions.getLocation('Request')).toBe('upload-key');
});

test('jsAccessorOperators lists every operator the client _js accessors call', () => {
  const called = new Set();
  const operators = new Proxy(
    {},
    {
      get: (_, name) => {
        called.add(name);
        return () => null;
      },
    }
  );
  const jsMap = {
    fn: (accessors) =>
      Object.entries(accessors)
        .filter(([, accessor]) => typeof accessor === 'function')
        .forEach(([, accessor]) => accessor('x')),
  };
  _js({ jsMap, operators, params: 'fn' });
  expect([...called].sort()).toEqual([...jsAccessorOperators].sort());
});
