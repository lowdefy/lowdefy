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
import { Breadcrumb } from 'antd';

import BreadcrumbBlock from '../src/blocks/Breadcrumb/Breadcrumb';
import examples from '../demo/examples/Breadcrumb.yaml';
import meta from '../src/blocks/Breadcrumb/Breadcrumb.json';

jest.mock('antd/lib/breadcrumb', () => {
  const breadcrumb = jest.fn(() => 'mocked');
  breadcrumb.Item = jest.fn(() => 'mocked');
  return breadcrumb;
});

const mocks = [
  {
    name: 'default',
    fn: Breadcrumb,
  },
];

runMockRenderTests({ examples, Block: BreadcrumbBlock, meta, mocks });
