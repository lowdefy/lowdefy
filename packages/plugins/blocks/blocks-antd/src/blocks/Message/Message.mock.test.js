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

import examples from './examples.yaml';
import Block from './Message.js';
import schema from './schema.json';

const testConfig = {
  validation: true,
  required: true,
  values: [],
};

jest.mock('antd', () => {
  const comp = jest.fn(() => 'mocked');
  comp.confirm = jest.fn(() => 'mocked');
  comp.error = jest.fn(() => 'mocked');
  comp.info = jest.fn(() => 'mocked');
  comp.success = jest.fn(() => 'mocked');
  comp.warning = jest.fn(() => 'mocked');
  return {
    message: comp,
  };
});

const mocks = [
  {
    getMockFns: async () => {
      const antd = await import('antd');
      return [
        antd.message,
        antd.message.confirm,
        antd.message.error,
        antd.message.info,
        antd.message.success,
        antd.message.warning,
      ];
    },
    getBlock: async () => {
      const Block = await import('./Message.js');
      return Block.default;
    },
    name: 'Message',
  },
];

runMockRenderTests({ Block, examples, mocks, schema, testConfig });
