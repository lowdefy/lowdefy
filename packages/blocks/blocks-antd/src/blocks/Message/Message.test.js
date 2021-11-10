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

import { runBlockSchemaTests, runMockMethodTests } from '@lowdefy/block-dev';
import { message } from 'antd';

import Message from './Message.js';
import examples from './examples.yaml';
import block from './index.js';
import schema from './schema.json';

const { meta } = block;

jest.mock('antd/lib/message', () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  };
});

const mocks = [
  {
    name: 'error',
    fn: message.error,
  },
  {
    name: 'info',
    fn: message.info,
  },
  {
    name: 'loading',
    fn: message.loading,
  },
  {
    name: 'success',
    fn: message.success,
  },
  {
    name: 'warning',
    fn: message.warning,
  },
];

runMockMethodTests({ examples, Block: Message, meta, mocks });
runBlockSchemaTests({ examples, meta, schema });
