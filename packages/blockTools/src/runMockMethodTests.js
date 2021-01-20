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
import { type } from '@lowdefy/helpers';

import mockBlock from './mockBlock';

const runMockMethodTests = ({ Block, enzyme, examples, logger, meta, mocks }) => {
  const { before, methods, getProps } = mockBlock({ meta, logger });

  beforeEach(() => {
    before();
  });
  const values = meta.values
    ? [type.enforceType(meta.valueType, null), ...meta.values]
    : [type.enforceType(meta.valueType, null)];

  examples.forEach((ex) => {
    values.forEach((value, v) => {
      if (meta.test && meta.test.methods) {
        meta.test.methods.forEach((method) => {
          mocks.forEach((mock) => {
            test(`Mock for method: ${JSON.stringify(method)} - ${ex.id} - value[${v}] - ${
              mock.name
            }`, () => {
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
              const wrapper = enzyme.mount(<Shell />);
              wrapper.find('[data-testid="btn_method"]').simulate('click');
              expect(mock.fn.mock.calls).toMatchSnapshot();
            });
          });
        });
      }
    });
  });
};

export default runMockMethodTests;
