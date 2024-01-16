/*
  Copyright 2020-2024 Lowdefy, Inc

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

import Block from './ParagraphInput.js';
import examples from './examples.yaml';
import schema from './schema.json';

const testConfig = {
  required: true,
  validation: true,
  values: [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  ],
};

jest.mock('antd', () => {
  const comp = jest.fn(() => 'mocked');
  comp.Paragraph = jest.fn(() => 'mocked');
  return {
    Typography: comp,
  };
});
const mocks = [
  {
    getMockFns: async () => {
      const antd = await import('antd');
      return [antd.Typography.Paragraph];
    },
    getBlock: async () => {
      const Block = await import('./ParagraphInput.js');
      return Block.default;
    },
    name: 'ParagraphInput',
  },
];
runMockRenderTests({ Block, examples, mocks, schema, testConfig });
