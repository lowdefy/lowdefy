/*
  Copyright 2020-2021 Lowdefy, Inc

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

import { runMockRenderTests } from '@lowdefy/block-dev';

import block from './index.js';
import examples from './examples.yaml';
import schema from './schema.json';

const { meta, tests } = block;

jest.mock('react-color', () => {
  const selectors = {
    TwitterPicker: jest.fn(() => 'mocked'),
  };
  return selectors;
});

const mocks = [
  {
    getMockFns: async () => {
      const antd = await import('react-color');
      return [antd.TwitterPicker];
    },
    getBlock: async () => {
      const Block = await import('./TwitterColorSelector.js');
      return Block.default;
    },
    name: 'TwitterColorSelector',
  },
];

runMockRenderTests({ examples, meta, mocks, schema, tests });
