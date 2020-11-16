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

const runRenderTests = ({ examples, Block, meta, logger, validationsExamples }) => {
  const { before, methods, getProps } = mockBlock({ meta, logger });

  beforeEach(before);

  examples.forEach((ex) => {
    test(`Render ${ex.id}`, () => {
      // create shell to setup react hooks with getProps before render;
      const Shell = () => <Block {...getProps({ ...ex, methods })} />;
      const comp = renderer.create(<Shell />);
      const tree = comp.toJSON();
      expect(tree).toMatchSnapshot();
      comp.unmount();
    });

    if (meta.test && meta.test.validation) {
      (validationsExamples || []).map((validationEx) => {
        test(`Render validation.status = ${validationEx.status} ${ex.id}`, () => {
          // create shell to setup react hooks with getProps before render;
          const Shell = () => <Block {...getProps({ ...ex, methods })} validation={validationEx} />;
          const comp = renderer.create(<Shell />);
          const tree = comp.toJSON();
          expect(tree).toMatchSnapshot();
          comp.unmount();
        });
      });
    }

    if (meta.test && meta.test.required) {
      test(`Render required = true ${ex.id}`, () => {
        // create shell to setup react hooks with getProps before render;
        const Shell = () => <Block {...getProps({ ...ex, methods })} required />;
        const comp = renderer.create(<Shell />);
        const tree = comp.toJSON();
        expect(tree).toMatchSnapshot();
        comp.unmount();
      });
    }
  });
};

export default runRenderTests;
