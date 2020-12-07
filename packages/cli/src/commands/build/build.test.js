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
import getBuildScript from '../../utils/getBuildScript';
import createContext from '../../utils/context';

const info = jest.fn();
const succeed = jest.fn();
const log = jest.fn();

jest.mock('../../utils/getBuildScript', () => {
  const buildScript = jest.fn();
  return (context) => {
    context.buildScript = buildScript;
    return context;
  };
});

jest.mock('../../utils/context', () => {
  const createContext = jest.fn();
  return createContext;
});

beforeEach(() => {
  createContext.mockReset();
});

test('build', async () => {
  const baseDirectory = process.cwd();
  const cacheDirectory = path.resolve(process.cwd(), '.lowdefy/.cache');
  const outputDirectory = path.resolve(process.cwd(), '.lowdefy/build');
  createContext.mockImplementation(() => ({
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
  const context = createContext.mock.results[0].value;
  const { buildScript } = context;
  expect(createContext).toHaveBeenCalledTimes(1);
  expect(buildScript).toHaveBeenCalledTimes(1);
  expect(buildScript.mock.calls[0][0].outputDirectory).toEqual(outputDirectory);
  expect(buildScript.mock.calls[0][0].cacheDirectory).toEqual(cacheDirectory);
  expect(buildScript.mock.calls[0][0].outputDirectory).toEqual(outputDirectory);
});
