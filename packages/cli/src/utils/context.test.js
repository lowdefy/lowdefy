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
import createContext from './context';
// eslint-disable-next-line no-unused-vars
import getLowdefyVersion from './getLowdefyVersion';
// eslint-disable-next-line no-unused-vars
import createPrint from './print';

jest.mock('./getLowdefyVersion', () => async () => Promise.resolve('lowdefy-version'));
jest.mock('./print', () => () => 'print');

test('createContext, options undefined', async () => {
  const context = await createContext();
  expect(context).toEqual({
    baseDirectory: path.resolve(process.cwd()),
    cacheDirectory: path.resolve(process.cwd(), './.lowdefy/.cache'),
    outputDirectory: path.resolve(process.cwd(), './.lowdefy/build'),
    version: 'lowdefy-version',
    print: 'print',
  });
});

test('createContext, options empty', async () => {
  const context = await createContext({});
  expect(context).toEqual({
    baseDirectory: path.resolve(process.cwd()),
    cacheDirectory: path.resolve(process.cwd(), './.lowdefy/.cache'),
    outputDirectory: path.resolve(process.cwd(), './.lowdefy/build'),
    version: 'lowdefy-version',
    print: 'print',
  });
});

test('createContext, options baseDirectory', async () => {
  const context = await createContext({ baseDirectory: './baseDirectory' });
  expect(context).toEqual({
    baseDirectory: path.resolve(process.cwd(), 'baseDirectory'),
    cacheDirectory: path.resolve(process.cwd(), 'baseDirectory/.lowdefy/.cache'),
    outputDirectory: path.resolve(process.cwd(), 'baseDirectory/.lowdefy/build'),
    version: 'lowdefy-version',
    print: 'print',
  });
});

test('createContext, options outputDirectory', async () => {
  const context = await createContext({ outputDirectory: './outputDirectory' });
  expect(context).toEqual({
    baseDirectory: path.resolve(process.cwd()),
    cacheDirectory: path.resolve(process.cwd(), '.lowdefy/.cache'),
    outputDirectory: path.resolve(process.cwd(), 'outputDirectory'),
    version: 'lowdefy-version',
    print: 'print',
  });
});

test('createContext, options baseDirectory and outputDirectory', async () => {
  const context = await createContext({
    baseDirectory: './baseDirectory',
    outputDirectory: './outputDirectory',
  });
  expect(context).toEqual({
    baseDirectory: path.resolve(process.cwd(), 'baseDirectory'),
    cacheDirectory: path.resolve(process.cwd(), 'baseDirectory/.lowdefy/.cache'),
    outputDirectory: path.resolve(process.cwd(), 'outputDirectory'),
    version: 'lowdefy-version',
    print: 'print',
  });
});
