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
import Enzyme, { mount } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { Modal } from 'antd';

Enzyme.configure({ adapter: new Adapter() });
import ConfirmModal from '../src/blocks/ConfirmModal/ConfirmModal';
import examples from '../demo/examples/ConfirmModal.yaml';
import meta from '../src/blocks/ConfirmModal/ConfirmModal.json';

jest.mock('@lowdefy/block-tools', () => {
  const originalModule = jest.requireActual('@lowdefy/block-tools');
  return {
    ...originalModule,
    blockDefaultProps: {
      ...originalModule.blockDefaultProps,
      methods: {
        ...originalModule.blockDefaultProps.methods,
        makeCssClass: jest.fn((style, op) => JSON.stringify({ style, options: op })),
      },
    },
  };
});

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

runMockMethodTests({ examples, Block: ConfirmModal, mocks, meta, enzyme: { mount } });
runBlockSchemaTests({ examples, meta });
