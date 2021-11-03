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
import { Modal } from 'antd';

import ConfirmModal from '../src/blocks/ConfirmModal/ConfirmModal';
import examples from '../demo/examples/ConfirmModal.yaml';
import meta from '../src/blocks/ConfirmModal/ConfirmModal.json';

jest.mock('antd/lib/modal', () => {
  return {
    confirm: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  };
});

const mocks = [
  {
    name: 'confirm',
    fn: Modal.confirm,
  },
  {
    name: 'error',
    fn: Modal.error,
  },
  {
    name: 'info',
    fn: Modal.info,
  },
  {
    name: 'success',
    fn: Modal.success,
  },
  {
    name: 'warning',
    fn: Modal.warning,
  },
];

runMockMethodTests({ examples, Block: ConfirmModal, mocks, meta });
runBlockSchemaTests({ examples, meta });
