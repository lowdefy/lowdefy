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
import { mockBlock, runBlockSchemaTests, runRenderTests } from '@lowdefy/block-tools';
import { configure, mount } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
configure({ adapter: new Adapter() });

import { DangerousHtml } from '../src';
import examples from '../demo/examples/Html.yaml';
import meta from '../src/blocks/Html/Html.json';

jest.mock('@lowdefy/block-tools', () => {
  const originalModule = jest.requireActual('@lowdefy/block-tools');
  return {
    ...originalModule,
    blockDefaultProps: {
      ...originalModule.blockDefaultProps,
      methods: {
        ...originalModule.blockDefaultProps.methods,
        makeCssClass: jest.fn((style, op) => JSON.stringify({ style, options: op })),
      },
    },
  };
});

runRenderTests({ examples, Block: DangerousHtml, meta });
runBlockSchemaTests({ examples, meta });

const { before, methods, getProps } = mockBlock({ meta });
beforeEach(before);

test('update on properties.html change', () => {
  const config = {
    id: 'update',
    type: 'Html',
    properties: {
      html: '<div>one</div>',
    },
  };
  const Shell = ({ properties }) => (
    <DangerousHtml {...getProps(config)} methods={methods} properties={properties} />
  );
  const wrapper = mount(<Shell properties={config.properties} />);
  expect(wrapper.html()).toMatchInlineSnapshot(
    `"<div id=\\"update\\" data-testid=\\"update\\" class=\\"{}\\"><div>one</div></div>"`
  );
  wrapper.setProps({ properties: { html: '<div>two</div>' } });
  wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(
    `"<div id=\\"update\\" data-testid=\\"update\\" class=\\"{}\\"><div>two</div></div>"`
  );
});
