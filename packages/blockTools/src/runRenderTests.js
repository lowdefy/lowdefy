/*
  Copyright 2020 Lowdefy, Inc

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
import renderer from 'react-test-renderer';
import { type } from '@lowdefy/helpers';
import { MemoryRouter } from 'react-router-dom';

import mockBlock from './mockBlock';

const runRenderTests = ({
  Block,
  examples,
  logger,
  meta,
  reset = () => null,
  validationsExamples,
}) => {
  const { before, methods, getProps } = mockBlock({ meta, logger });

  beforeEach(() => {
    reset();
    before();
  });
  const values = meta.values
    ? [type.enforceType(meta.valueType, null), ...meta.values]
    : [type.enforceType(meta.valueType, null)];

  examples.forEach((ex) => {
    values.forEach((value, v) => {
      test(`Render ${ex.id} - value[${v}]`, () => {
        // create shell to setup react hooks with getProps before render;
        const Shell = () => <Block {...getProps(ex)} value={value} methods={methods} />;
        const comp = renderer.create(
          <MemoryRouter>
            <Shell />
          </MemoryRouter>
        );
        const tree = comp.toJSON();
        expect(tree).toMatchSnapshot();
        comp.unmount();
      });

      if (meta.test && meta.test.validation) {
        (validationsExamples || []).map((validationEx) => {
          test(`Render validation.status = ${validationEx.status} ${ex.id} - value[${v}]`, () => {
            // create shell to setup react hooks with getProps before render;
            const Shell = () => (
              <Block {...getProps(ex)} value={value} methods={methods} validation={validationEx} />
            );
            const comp = renderer.create(
              <MemoryRouter>
                <Shell />
              </MemoryRouter>
            );
            const tree = comp.toJSON();
            expect(tree).toMatchSnapshot();
            comp.unmount();
          });
        });
      }

      if (meta.test && meta.test.required) {
        test(`Render required = true ${ex.id} - value[${v}]`, () => {
          // create shell to setup react hooks with getProps before render;
          const Shell = () => <Block {...getProps(ex)} value={value} methods={methods} required />;
          const comp = renderer.create(
            <MemoryRouter>
              <Shell />
            </MemoryRouter>
          );
          const tree = comp.toJSON();
          expect(tree).toMatchSnapshot();
          comp.unmount();
        });
      }
    });
  });
};

export default runRenderTests;
