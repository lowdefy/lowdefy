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

// Kept separate from app.test.js because this test needs @lowdefy/operators mocked, while
// app.test.js exercises the real getFromObject. Mocking at top level avoids a mid-file
// jest.resetModules() re-import, which crashes Jest 28's ESM loader.
import { vi, expect, test } from 'vitest';

const mockGetFromObject = vi.fn();
vi.doMock('@lowdefy/operators', () => ({
  getFromObject: mockGetFromObject,
}));

const { default: _app } = await import('./app.js');

test('_app forwards arguments to getFromObject', () => {
  _app({
    arrayIndices: [0],
    location: 'location',
    params: 'name',
    lowdefyApp: { name: 'My App' },
  });
  expect(mockGetFromObject.mock.calls).toEqual([
    [
      {
        arrayIndices: [0],
        location: 'location',
        object: { name: 'My App' },
        operator: '_app',
        params: 'name',
      },
    ],
  ]);
});
