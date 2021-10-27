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
import { Collapse } from 'antd';

import CollapseBlock from '../src/blocks/Collapse/Collapse';
import examples from '../demo/examples/Collapse.yaml';
import meta from '../src/blocks/Collapse/Collapse.json';

jest.mock('antd/lib/collapse', () => {
  const collapse = jest.fn(() => 'mocked');
  collapse.Panel = jest.fn(() => 'mocked');
  return collapse;
});

const mocks = [
  {
    name: 'default',
    fn: Collapse,
  },
];

runMockRenderTests({ examples, Block: CollapseBlock, meta, mocks });
