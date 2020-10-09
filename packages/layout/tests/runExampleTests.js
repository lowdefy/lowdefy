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
import AutoBlockSim from '../demo/AutoBlockSim';

const mockMath = Object.create(global.Math);
mockMath.random = () => 0.123456789;
global.Math = mockMath;

const runExampleTests = (examples, options = { highlightBorders: true }) => {
  const makeCssClass = jest.fn();
  const makeCssImp = (style, op) => JSON.stringify({ style, options: op });

  beforeEach(() => {
    makeCssClass.mockReset();
    makeCssClass.mockImplementation(makeCssImp);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  examples.forEach((ex) => {
    test(ex.id, () => {
      const component = renderer.create(
        <AutoBlockSim
          block={ex}
          state={{}}
          areaKey="content"
          makeCssClass={makeCssClass}
          highlightBorders={options.highlightBorders}
        />
      );
      const tree = component.toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
};

export default runExampleTests;
