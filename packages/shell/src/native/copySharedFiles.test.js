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

import { beforeEach, expect, test, vi } from 'vitest';

import copySharedFiles from './copySharedFiles.js';

// A file system in memory: the folders created and the names copied into each.
const mockFolders = new Map();
let mockIds = [];

vi.mock('expo-crypto', () => ({ randomUUID: () => mockIds.shift() }));
vi.mock('expo-file-system', () => {
  class Directory {
    constructor(parent, name) {
      this.uri = `${parent.uri ?? parent}/${name}`;
    }
    create(options) {
      if (options?.intermediates !== true) throw new Error('intermediates missing');
      mockFolders.set(this.uri, []);
    }
    list() {
      return mockFolders.get(this.uri).map((name) => ({ uri: `${this.uri}/${name}` }));
    }
  }
  class File {
    constructor(uri) {
      this.uri = uri;
    }
    async copy(folder) {
      if (this.uri.includes('missing')) throw new Error(`No file at ${this.uri}.`);
      mockFolders.get(folder.uri).push(this.uri.split('/').pop());
    }
  }
  return { Directory, File, Paths: { cache: 'file:///cache' } };
});

beforeEach(() => {
  mockFolders.clear();
  mockIds = ['first', 'second'];
});

test('copySharedFiles copies each file into a folder of its own in the share folder', async () => {
  expect(
    await copySharedFiles({
      files: [
        {
          name: 'report.pdf',
          mimeType: 'application/pdf',
          size: 2048,
          uri: 'file:///group/Library/Caches/expo-sharing/A/report.pdf',
          type: 'file',
        },
      ],
    })
  ).toEqual([
    {
      name: 'report.pdf',
      mimeType: 'application/pdf',
      size: 2048,
      uri: 'file:///cache/lowdefy-share/first/report.pdf',
      type: 'file',
    },
  ]);
});

test('copySharedFiles keeps two files with the same name apart', async () => {
  const files = await copySharedFiles({
    files: [
      { name: 'photo.jpg', uri: 'file:/data/cache/expo-sharing/A/photo.jpg' },
      { name: 'photo.jpg', uri: 'file:/data/cache/expo-sharing/B/photo.jpg' },
    ],
  });
  expect(files.map((file) => file.uri)).toEqual([
    'file:///cache/lowdefy-share/first/photo.jpg',
    'file:///cache/lowdefy-share/second/photo.jpg',
  ]);
});

test('copySharedFiles rejects when a shared file cannot be copied', async () => {
  await expect(
    copySharedFiles({ files: [{ name: 'gone.pdf', uri: 'file:///missing/gone.pdf' }] })
  ).rejects.toThrow('No file at file:///missing/gone.pdf.');
});
