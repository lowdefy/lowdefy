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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import mockBlock from './mockBlock.js';

const runMockMethodTests = ({ Block, examples, mocks, schema, testConfig }) => {
  const meta = Block.meta;
  const { before, methods, getProps } = mockBlock({ meta, schema });

  beforeEach(() => {
    before();
  });
  const values = meta.values
    ? [type.enforceType(meta.valueType, null), ...meta.values]
    : [type.enforceType(meta.valueType, null)];

  examples.forEach((ex) => {
    values.forEach((value, v) => {
      if (testConfig?.methods) {
        testConfig.methods.forEach((method) => {
          mocks.forEach((mock) => {
            test(`Mock for method: ${JSON.stringify(method)} - ${ex.id} - value[${v}] - ${
              mock.name
            }`, async () => {
              const mockFns = await mock.getMockFns();
              const Block = await mock.getBlock();
              const Shell = () => {
                const props = getProps(ex);
                props.methods = { ...methods, registerMethod: props.methods.registerMethod };
                return (
                  <>
                    <Block {...props} value={value} />
                    <button
                      id={`${ex.id}_button`}
                      onClick={() => {
                        props.methods[method.name](method.args);
                      }}
                      data-testid="btn_method"
                    />
                  </>
                );
              };
              const { container } = render(<Shell />);
              expect(container.firstChild).toMatchSnapshot();
              userEvent.click(screen.getByTestId('btn_method'));
              mockFns.forEach((mockFn) => {
                expect(mockFn.mock.calls).toMatchSnapshot();
              });
            });
          });
        });
      }
    });
  });
};

export default runMockMethodTests;
