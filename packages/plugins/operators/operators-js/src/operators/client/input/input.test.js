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

import { jest } from '@jest/globals';

jest.unstable_mockModule('@lowdefy/operators', () => ({
  getFromObject: jest.fn(),
}));

test('input calls getFromObject', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  const input = (await import('./input.js')).default;
  input({
    arrayIndices: [0],
    input: { input: true },
    location: 'location',
    params: 'params',
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        arrayIndices: [0],
        location: 'location',
        object: {
          input: true,
        },
        operator: '_input',
        params: 'params',
      },
    ],
  ]);
});
