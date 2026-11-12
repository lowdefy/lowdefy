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

import clearShareFolder from './clearShareFolder.js';

let mockExists = true;
const mockDeleted = [];

jest.mock('expo-file-system', () => ({
  Directory: class {
    constructor(parent, name) {
      this.uri = `${parent}/${name}`;
      this.exists = mockExists;
    }
    delete() {
      mockDeleted.push(this.uri);
    }
  },
  Paths: { cache: 'file:///cache' },
}));

beforeEach(() => {
  mockDeleted.length = 0;
});

test('clearShareFolder deletes the share folder in the cache', () => {
  mockExists = true;
  clearShareFolder();
  expect(mockDeleted).toEqual(['file:///cache/lowdefy-share']);
});

test('clearShareFolder does nothing when no file was shared since the cache was emptied', () => {
  mockExists = false;
  clearShareFolder();
  expect(mockDeleted).toEqual([]);
});
