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
import path from 'path';
import build from './build';
// eslint-disable-next-line no-unused-vars
import getFederatedModule from '../../utils/getFederatedModule';
import startUp from '../../utils/startUp';

const info = jest.fn();
const succeed = jest.fn();
const log = jest.fn();

jest.mock('../../utils/getFederatedModule', () => {
  const buildScript = jest.fn();
  return () => {
    return { default: buildScript };
  };
});

jest.mock('../../utils/startUp', () => {
  const startUp = jest.fn();
  return startUp;
});

beforeEach(() => {
  startUp.mockReset();
});

test('build', async () => {
  const baseDirectory = process.cwd();
  const cacheDirectory = path.resolve(process.cwd(), '.lowdefy/.cache');
  const outputDirectory = path.resolve(process.cwd(), '.lowdefy/build');
  startUp.mockImplementation(() => ({
    print: {
      info,
      succeed,
      log,
    },
    baseDirectory,
    cacheDirectory,
    outputDirectory,
  }));
  await build({});
  const context = startUp.mock.results[0].value;
  const { default: buildScript } = getFederatedModule();
  expect(startUp).toHaveBeenCalledTimes(1);
  expect(buildScript).toHaveBeenCalledTimes(1);
  expect(buildScript.mock.calls[0][0].outputDirectory).toEqual(outputDirectory);
  expect(buildScript.mock.calls[0][0].cacheDirectory).toEqual(cacheDirectory);
  expect(buildScript.mock.calls[0][0].outputDirectory).toEqual(outputDirectory);
});
