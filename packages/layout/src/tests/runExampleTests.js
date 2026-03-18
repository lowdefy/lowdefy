/*
  Copyright 2020-2026 Lowdefy, Inc

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
import { render } from '@testing-library/react';

import AutoBlockSim from './blocks/AutoBlockSim.js';

const mockMath = Object.create(global.Math);
mockMath.random = () => 0.123456789;
global.Math = mockMath;

const runExampleTests = (examples) => {
  examples.forEach((ex) => {
    test(ex.id, () => {
      const { container } = render(
        <AutoBlockSim block={ex} state={{}} areaKey="content" />
      );
      expect(container).toMatchSnapshot();
    });
  });
};

export default runExampleTests;
