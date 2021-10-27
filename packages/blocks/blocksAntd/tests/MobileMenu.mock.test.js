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
import { Button, Drawer } from 'antd';

import MobileMenuBlock from '../src/blocks/MobileMenu/MobileMenu';
import examples from '../demo/examples/MobileMenu.yaml';
import meta from '../src/blocks/MobileMenu/MobileMenu.json';

jest.mock('antd/lib/button', () => {
  return jest.fn(() => 'mocked');
});
jest.mock('antd/lib/drawer', () => {
  return jest.fn(() => 'mocked');
});

const mocks = [
  {
    name: 'Drawer',
    fn: Drawer,
  },
  {
    name: 'Button',
    fn: Button,
  },
];

runMockRenderTests({ examples, Block: MobileMenuBlock, meta, mocks });
