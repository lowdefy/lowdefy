/*
  Copyright 2020-2024 Lowdefy, Inc

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

import React from 'react';
import { mockBlock, runBlockSchemaTests, runRenderTests } from '@lowdefy/block-dev';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Block from './List.js';
import examples from './examples.yaml';
import schema from './schema.json';

const testConfig = {
  validation: true,
  required: true,
  values: [],
};

runRenderTests({ Block, examples, schema, testConfig });
runBlockSchemaTests({ examples, schema });

const { before, methods, getProps } = mockBlock({ meta: Block.meta, schema });
beforeEach(before);

test('triggerEvent onClick', () => {
  const block = {
    id: 'one',
    type: 'List',
  };
  const Shell = () => <Block {...getProps(block)} methods={methods} />;
  const { container } = render(<Shell />);
  expect(container.firstChild).toMatchSnapshot();
  userEvent.click(screen.getByTestId('one'));
  expect(methods.triggerEvent).toHaveBeenCalledWith({ name: 'onClick' });
});

test('register list methods on mount', () => {
  const block = {
    id: 'update',
    type: 'List',
    properties: {
      style: { test: 1 },
    },
    blocks: [
      {
        id: 'one',
        type: 'Test',
      },
    ],
  };
  const Shell = ({ properties }) => (
    <Block {...getProps(block)} methods={methods} properties={properties} />
  );
  const { container, rerender } = render(<Shell properties={block.properties} />);
  expect(container.firstChild).toMatchSnapshot();
  expect(methods.registerMethod).toMatchSnapshot();
  expect(methods.registerMethod).toHaveBeenCalledTimes(5);
  // only on mount
  rerender(<Shell properties={{ test: 2 }} />);
  expect(methods.registerMethod).toHaveBeenCalledTimes(5);
});
