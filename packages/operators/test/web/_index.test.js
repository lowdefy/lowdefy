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

import _index from '../../src/web/_index';
import getFromObject from '../../src/getFromObject';

jest.mock('../../src/getFromObject');

const input = {
  arrayIndices: [0],
  context: { context: true },
  contexts: { contexts: true },
  env: 'env',
  location: 'location',
  params: 'params',
};

test('args calls getFromObject', () => {
  _index(input);
  expect(getFromObject.mock.calls).toEqual([
    [
      {
        arrayIndices: [0],
        env: 'env',
        location: 'location',
        object: [0],
        operator: '_index',
        params: 'params',
      },
    ],
  ]);
});
