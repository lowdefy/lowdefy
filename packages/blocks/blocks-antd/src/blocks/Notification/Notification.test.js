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
import { notification } from 'antd';

import Notification from './Notification';
import examples from './examples.yaml';
import meta from './index';
import schema from './schema.json';

jest.mock('antd/lib/notification', () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  };
});

const mocks = [
  {
    name: 'error',
    fn: notification.error,
  },
  {
    name: 'info',
    fn: notification.info,
  },
  {
    name: 'success',
    fn: notification.success,
  },
  {
    name: 'warning',
    fn: notification.warning,
  },
];

runMockMethodTests({ examples, Block: Notification, meta, mocks });
runBlockSchemaTests({ examples, meta, schema });
