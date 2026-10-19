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

import { jest } from '@jest/globals';
import path from 'path';

test('relativePosixPath joins segments with forward slashes', async () => {
  const { default: relativePosixPath } = await import('./relativePosixPath.js');
  expect(
    relativePosixPath({ from: '/repo/app', to: '/repo/app/tests/journeys/tickets.yaml' })
  ).toEqual('tests/journeys/tickets.yaml');
});

test('relativePosixPath turns Windows separators into forward slashes', async () => {
  jest.resetModules();
  jest.unstable_mockModule('path', () => ({ default: path.win32 }));
  const { default: relativePosixPath } = await import('./relativePosixPath.js');
  expect(
    relativePosixPath({ from: 'C:\\repo\\app', to: 'C:\\repo\\app\\tests\\journeys\\tickets.yaml' })
  ).toEqual('tests/journeys/tickets.yaml');
  expect(relativePosixPath({ from: 'C:\\repo\\app', to: 'C:\\repo\\other\\tickets.yaml' })).toEqual(
    '../other/tickets.yaml'
  );
});
