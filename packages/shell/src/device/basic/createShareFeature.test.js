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

import createShareFeature from './createShareFeature.js';

// expo-file-system and expo-sharing both map to the native stand-in (jest.config.js), so one mock
// serves both.
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache' },
  File: class {
    constructor(directory, name) {
      this.uri = `${directory}/${name}`;
      this.exists = false;
    }
    create() {}
    write() {}
  },
  shareAsync: jest.fn(async () => undefined),
}));

const Sharing = require('expo-sharing');

async function shareNamed(name) {
  await createShareFeature()({ base64: 'aGk=', name });
  return Sharing.shareAsync.mock.calls.at(-1)[0];
}

test('a shared base64 file is written to the cache under the last segment of its name', async () => {
  expect(await shareNamed('report.pdf')).toBe('file:///cache/report.pdf');
  expect(await shareNamed('../../Documents/token.json')).toBe('file:///cache/token.json');
  expect(await shareNamed('..\\secrets.txt')).toBe('file:///cache/secrets.txt');
  expect(await shareNamed('..')).toBe('file:///cache/shared-file');
  expect(await shareNamed(undefined)).toBe('file:///cache/shared-file');
});
