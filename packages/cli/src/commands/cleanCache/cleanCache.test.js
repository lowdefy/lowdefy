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
import path from 'path';
import fse from 'fs-extra';

import cleanCache from './cleanCache';
// eslint-disable-next-line no-unused-vars
import startUp from '../../utils/startUp';

jest.mock('fs-extra', () => {
  const emptyDir = jest.fn();
  return { emptyDir };
});

jest.mock('../../utils/startUp');

beforeEach(() => {
  fse.emptyDir.mockReset();
});

test('cleanCache', async () => {
  await cleanCache({});
  const cachePath = path.resolve(process.cwd(), './.lowdefy/.cache');
  expect(fse.emptyDir.mock.calls).toEqual([[cachePath]]);
});

test('cleanCache baseDir', async () => {
  await cleanCache({ baseDirectory: 'baseDir' });
  const cachePath = path.resolve(process.cwd(), 'baseDir/.lowdefy/.cache');
  expect(fse.emptyDir.mock.calls).toEqual([[cachePath]]);
});
