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
import mockBlock from './mockBlock';
import { MemoryRouter } from 'react-router-dom';

const runRenderTests = ({
  Block,
  enzyme,
  examples,
  logger,
  meta,
  reset = () => null,
  validationsExamples,
}) => {
  const { before, methods, getProps } = mockBlock({ meta, logger });

  beforeEach(before);
  beforeEach(() => {
    reset();
    before();
  });

  examples.forEach((ex) => {
    test(`Render ${ex.id}`, () => {
      // create shell to setup react hooks with getProps before render;
      const Shell = () => <Block {...getProps(ex)} methods={methods} />;
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
        test(`Render validation.status = ${validationEx.status} ${ex.id}`, () => {
          // create shell to setup react hooks with getProps before render;
          const Shell = () => (
            <Block {...getProps(ex)} methods={methods} validation={validationEx} />
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
      test(`Render required = true ${ex.id}`, () => {
        // create shell to setup react hooks with getProps before render;
        const Shell = () => <Block {...getProps(ex)} methods={methods} required />;
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

    if (meta.test && meta.test.methods) {
      meta.test.methods.forEach((method) => {
        test(`Render for method: ${JSON.stringify(method)} - ${ex.id}`, () => {
          const Shell = () => {
            const props = getProps(ex);
            props.methods = { ...methods, registerMethod: props.methods.registerMethod };
            return (
              <>
                <Block {...props} />
                <button
                  id={`${ex.id}_button`}
                  onClick={() => {
                    props.registeredMethods[method.name](method.args);
                  }}
                  data-testid="btn_method"
                />
              </>
            );
          };
          const wrapper = enzyme.mount(<Shell />);
          wrapper.find('[data-testid="btn_method"]').simulate('click');
          expect(document.body.innerHTML).toMatchSnapshot();
        });
      });
    }
  });
};

export default runRenderTests;
