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
    version: 'lowdefy-version',
    print: 'print',
  });
});

test('createContext, options empty', async () => {
  const context = await createContext({});
  expect(context).toEqual({
    baseDirectory: path.resolve(process.cwd()),
    cacheDirectory: path.resolve(process.cwd(), './.lowdefy/.cache'),
    version: 'lowdefy-version',
    print: 'print',
  });
});

test('createContext, options baseDir', async () => {
  const context = await createContext({ baseDirectory: 'baseDir' });
  expect(context).toEqual({
    baseDirectory: path.resolve(process.cwd(), 'baseDir'),
    cacheDirectory: path.resolve(process.cwd(), 'baseDir/.lowdefy/.cache'),
    version: 'lowdefy-version',
    print: 'print',
  });
});
