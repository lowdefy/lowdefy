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
import { type } from '@lowdefy/helpers';
import { render, waitFor } from '@testing-library/react';

import mockBlock from './mockBlock.js';

const runMockRenderTests = ({
  Block,
  examples,
  logger,
  mocks,
  reset = () => null,
  schema,
  testConfig,
}) => {
  const { before, getProps } = mockBlock({ meta: Block.meta, logger, schema });

  const makeCssClass = jest.fn();
  const makeCssImp = (style, op) => JSON.stringify({ style, options: op });

  beforeEach(async () => {
    await reset();
    before();
    makeCssClass.mockReset();
    makeCssClass.mockImplementation(makeCssImp);
  });

  examples.forEach((ex) => {
    const values = [type.enforceType(Block.meta.valueType, null)];
    if (!type.isNone(ex.value)) {
      values.push(ex.value);
    }
    if (type.isArray(testConfig.values)) {
      values.push(...testConfig.values);
    }
    values.forEach((value, v) => {
      mocks.forEach((mock) => {
        test(`Mock render - ${ex.id} - value[${v}] - ${mock.name}`, async () => {
          const mockFns = await mock.getMockFns();
          const Block = await mock.getBlock();
          const Shell = () => {
            const props = getProps(ex);
            return <Block {...props} methods={{ ...props.methods, makeCssClass }} value={value} />;
          };
          const { container } = render(<Shell />);
          await waitFor(() => expect(container.firstChild).toMatchSnapshot());
          mockFns.forEach((mockFn) => {
            expect(mockFn.mock.calls).toMatchSnapshot();
          });
        });
      });
    });
  });
};

export default runMockRenderTests;
