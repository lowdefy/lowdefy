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

import { runBlockSchemaTests, runMockMethodTests } from '@lowdefy/block-dev';

import Block from './ConfirmModal.js';
import examples from './examples.yaml';
import schema from './schema.json';

const testConfig = {
  validation: true,
  required: true,
  values: [],
  methods: [
    {
      name: 'open',
      args: {},
    },
    {
      name: 'open',
      args: {
        status: 'warning',
      },
    },
    {
      name: 'open',
      args: {
        message: 'Args message',
      },
    },
    {
      name: 'open',
      args: {
        description: 'Args description',
      },
    },
    {
      name: 'open',
      args: {
        duration: 1,
      },
    },
  ],
};

jest.mock('antd', () => {
  const comp = jest.fn(() => 'mocked');
  comp.confirm = jest.fn(() => 'mocked');
  comp.error = jest.fn(() => 'mocked');
  comp.info = jest.fn(() => 'mocked');
  comp.success = jest.fn(() => 'mocked');
  comp.warning = jest.fn(() => 'mocked');
  return {
    Modal: comp,
  };
});

const mocks = [
  {
    getMockFns: async () => {
      const antd = await import('antd');
      return [
        antd.Modal.confirm,
        antd.Modal.error,
        antd.Modal.info,
        antd.Modal.success,
        antd.Modal.warning,
      ];
    },
    getBlock: async () => {
      const Block = await import('./ConfirmModal.js');
      return Block.default;
    },
    name: 'ConfirmModal',
  },
];

runMockMethodTests({ Block, examples, mocks, schema, testConfig });
runBlockSchemaTests({ examples, schema });
