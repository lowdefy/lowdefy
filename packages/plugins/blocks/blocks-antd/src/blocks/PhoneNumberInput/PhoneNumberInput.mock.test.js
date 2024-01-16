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
import { Col, Row } from 'antd';

import Block from './PhoneNumberInput.js';
import examples from './examples.yaml';
import schema from './schema.json';

const testConfig = {
  validation: true,
  required: true,
  values: [],
};

jest.mock('antd', () => {
  const comp_input = jest.fn(() => 'mocked');
  const comp_select = jest.fn(() => 'mocked');
  comp_input.Option = jest.fn(() => 'mocked');
  comp_select.Option = jest.fn(() => 'mocked');
  return {
    Col,
    Input: comp_input,
    Select: comp_select,
    Row,
  };
});

const mocks = [
  {
    getMockFns: async () => {
      const antd = await import('antd');
      return [antd.Input, antd.Select];
    },
    getBlock: async () => {
      const Block = await import('./PhoneNumberInput.js');
      return Block.default;
    },
    name: 'PhoneNumberInput',
  },
];

runMockRenderTests({ Block, examples, mocks, schema, testConfig });
