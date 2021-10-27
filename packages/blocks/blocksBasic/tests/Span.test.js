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

import React from 'react';
import { mockBlock, runBlockSchemaTests, runRenderTests } from '@lowdefy/block-dev';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Span } from '../src';
import examples from '../demo/examples/Span.yaml';
import meta from '../src/blocks/Span/Span.json';

runRenderTests({ examples, Block: Span, meta });
runBlockSchemaTests({ examples, meta });

const { before, methods, getProps } = mockBlock({ meta });
beforeEach(before);

test('triggerEvent onClick', () => {
  const block = {
    id: 'one',
    type: 'Span',
  };
  const Shell = () => <Span {...getProps(block)} methods={methods} />;
  const { container } = render(<Shell />);
  expect(container.firstChild).toMatchSnapshot();
  userEvent.click(screen.getByTestId('one'));
  expect(methods.triggerEvent).toHaveBeenCalledWith({ name: 'onClick' });
});
