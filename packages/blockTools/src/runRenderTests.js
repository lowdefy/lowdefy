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

const runRenderTests = (examples, Block, meta) => {
  const { after, before, methods, getProps } = mockBlock(meta);

  beforeEach(before);
  afterEach(after);

  examples.forEach((ex) => {
    test(`Render ${ex.id}`, () => {
      // create shell to setup react hooks with getProps before render;
      const Shell = () => {
        const props = getProps(ex);
        return <Block {...getProps(ex)} methods={methods} />;
      };
      const comp = renderer.create(<Shell />, {
        createNodeMock: () => {
          return { innerHTML: '' };
        },
      });
      const tree = comp.toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
};

export default runRenderTests;
