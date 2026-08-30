/*
  Copyright 2020-2026 Lowdefy, Inc

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
import { jest } from '@jest/globals';
import React from 'react';
import { render } from '@testing-library/react';
import { BlockError } from '@lowdefy/errors';

import CategorySwitch from './CategorySwitch.js';

function createProps({ Component, category = 'display', blockType = 'MyBlock' }) {
  const block = {
    blockId: 'my_block',
    id: 'my_block',
    type: blockType,
    eval: { configKey: 'key-my-block', properties: {}, style: {} },
    methods: {},
    registerEvent: () => undefined,
    registerMethod: () => undefined,
    triggerEvent: () => 'triggered',
  };
  const lowdefy = {
    basePath: '',
    menus: [],
    pageId: 'page',
    _internal: {
      blockComponents: { [blockType]: Component },
      blockMetas: { [blockType]: { category } },
      components: {},
      translate: (key) => key,
    },
  };
  return { block, Blocks: {}, context: {}, loading: false, lowdefy };
}

// React logs every render error to console.error; keep the test output clean.
let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
});

test('CategorySwitch passes a methods bag that throws a located BlockError for a removed method', () => {
  const LegacyBlock = ({ methods }) => <div className={methods.makeCssClass({})}>x</div>;
  const props = createProps({ Component: LegacyBlock, blockType: 'LegacyBlock' });
  let error;
  try {
    render(<CategorySwitch {...props} />);
  } catch (e) {
    error = e;
  }
  expect(error).toBeInstanceOf(BlockError);
  expect(error.message).toContain('Block "my_block" (type LegacyBlock)');
  expect(error.message).toContain('removed block method "makeCssClass"');
  expect(error.message).toContain('classNames');
  expect(error.configKey).toBe('key-my-block');
  expect(error.typeName).toBe('LegacyBlock');
});

test('CategorySwitch passes live methods through the wrapped bag unchanged', () => {
  const Probe = ({ methods }) => <div data-testid="probe">{methods.triggerEvent()}</div>;
  const props = createProps({ Component: Probe });
  const { getByTestId } = render(<CategorySwitch {...props} />);
  expect(getByTestId('probe').textContent).toBe('triggered');
});
