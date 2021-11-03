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
import { Modal } from 'antd';

import ConfirmModalBlock from './ConfirmModal';
import examples from './examples.yaml';
import meta from './index';

jest.mock('antd/lib/modal', () => {
  const modal = jest.fn(() => 'mocked');
  modal.error = jest.fn(() => 'mocked');
  modal.success = jest.fn(() => 'mocked');
  modal.warning = jest.fn(() => 'mocked');
  modal.info = jest.fn(() => 'mocked');
  modal.confirm = jest.fn(() => 'mocked');
  return modal;
});

const mocks = [
  {
    name: 'default',
    fn: Modal,
  },
];

runMockRenderTests({ examples, Block: ConfirmModalBlock, meta, mocks });
