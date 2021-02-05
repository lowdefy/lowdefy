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

import { runMockRenderTests } from '@lowdefy/block-tools';
import Enzyme, { mount } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { Upload } from 'antd';

Enzyme.configure({ adapter: new Adapter() });
import S3UploadButton from '../src/blocks/S3UploadButton/S3UploadButton';
import examples from '../demo/examples/S3UploadButton.yaml';
import meta from '../src/blocks/S3UploadButton/S3UploadButton.json';

jest.mock('antd/lib/upload', () => {
  return jest.fn(() => 'mocked');
});

const mocks = [
  {
    name: 'default',
    fn: Upload,
  },
];

runMockRenderTests({ examples, Block: S3UploadButton, meta, mocks, enzyme: { mount } });
