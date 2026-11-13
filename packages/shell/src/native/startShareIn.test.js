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
import { Linking } from 'react-native';
import * as Sharing from 'expo-sharing';

import clearShareFolder from './clearShareFolder.js';
import copySharedFiles from './copySharedFiles.js';
import openPath from './openPath.js';
import reportShellError from '../host/reportShellError.js';
import startShareIn from './startShareIn.js';

// The order the share folder, expo-sharing's payloads and the copies were touched in.
const mockSteps = [];

vi.mock('./openPath.js', () => ({ default: vi.fn() }));
vi.mock('../host/reportShellError.js', () => ({ default: vi.fn() }));
vi.mock('./clearShareFolder.js', () => ({
  default: vi.fn(() => mockSteps.push('clear share folder')),
}));
vi.mock('./copySharedFiles.js', () => ({
  default: vi.fn(async ({ files }) => {
    mockSteps.push('copy');
    return files.map((file, index) => ({
      ...file,
      uri: `file:///cache/lowdefy-share/${index}/${file.name}`,
    }));
  }),
}));
vi.mock('expo-sharing', () => ({
  getResolvedSharedPayloadsAsync: vi.fn(),
  clearSharedPayloads: vi.fn(() => mockSteps.push('clear expo-sharing')),
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const report = {
  shareType: 'file',
  value: 'file:///group/Library/Caches/expo-sharing/A/report.pdf',
  contentUri: 'file:///group/Library/Caches/expo-sharing/A/report.pdf',
  contentType: 'file',
  contentMimeType: 'application/pdf',
  originalName: 'report.pdf',
  contentSize: 2048,
};

function createApp() {
  const root = { share: { pageId: 'inbox' }, pageIndex: [{ pageId: 'inbox', path: 'inbox' }] };
  return {
    ready: Promise.resolve(),
    session: { getState: () => ({ root }) },
    triggerAppEvent: vi.fn(),
  };
}

beforeEach(() => {
  mockSteps.length = 0;
  vi.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
});

test('startShareIn empties the share folder when the app opens', () => {
  startShareIn({ app: createApp() });
  expect(clearShareFolder).toHaveBeenCalledTimes(1);
});

test('startShareIn opens the app when the share folder cannot be emptied, and reports it', () => {
  const error = new Error('Folder is locked.');
  clearShareFolder.mockImplementationOnce(() => {
    throw error;
  });
  const app = createApp();
  expect(() => startShareIn({ app })).not.toThrow();
  expect(reportShellError).toHaveBeenCalledWith({ error, session: app.session });
});

test('a shared file is copied before expo-sharing clears it, and the share page gets the copy', async () => {
  Sharing.getResolvedSharedPayloadsAsync.mockResolvedValue([
    { shareType: 'text', value: 'Pump 4 is leaking' },
    report,
  ]);
  const app = createApp();
  await startShareIn({ app }).receive();
  expect(mockSteps).toEqual(['clear share folder', 'copy', 'clear expo-sharing']);
  const shared = {
    text: 'Pump 4 is leaking',
    urls: [],
    files: [
      {
        name: 'report.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        uri: 'file:///cache/lowdefy-share/0/report.pdf',
        type: 'file',
      },
    ],
  };
  expect(openPath).toHaveBeenCalledWith({ app, path: '/inbox', query: { shared } });
  expect(app.triggerAppEvent).toHaveBeenCalledWith({ name: 'onShare', event: shared });
});

test('expo-sharing is cleared when a shared file cannot be copied, and the share is reported', async () => {
  const error = new Error('No file at the shared uri.');
  copySharedFiles.mockRejectedValueOnce(error);
  Sharing.getResolvedSharedPayloadsAsync.mockResolvedValue([report]);
  vi.spyOn(Linking, 'getInitialURL').mockResolvedValue('field://expo-sharing');
  const app = createApp();
  startShareIn({ app });
  await flush();
  expect(Sharing.clearSharedPayloads).toHaveBeenCalledTimes(1);
  expect(reportShellError).toHaveBeenCalledWith({ error, session: app.session });
  expect(openPath).not.toHaveBeenCalled();
  expect(app.triggerAppEvent).not.toHaveBeenCalled();
});

test('nothing opens when expo-sharing has nothing waiting', async () => {
  Sharing.getResolvedSharedPayloadsAsync.mockResolvedValue([]);
  const app = createApp();
  await startShareIn({ app }).receive();
  expect(Sharing.clearSharedPayloads).toHaveBeenCalledTimes(1);
  expect(openPath).not.toHaveBeenCalled();
  expect(app.triggerAppEvent).not.toHaveBeenCalled();
});

test('injected files reach the share page as they are, without copying or clearing expo-sharing', async () => {
  const app = createApp();
  await startShareIn({ app }).receive({
    payloads: [
      {
        shareType: 'file',
        value: 'file:///dev/photo.jpg',
        contentUri: 'file:///dev/photo.jpg',
        contentType: 'file',
        contentMimeType: 'image/jpeg',
        originalName: 'photo.jpg',
        contentSize: null,
      },
    ],
  });
  expect(copySharedFiles).not.toHaveBeenCalled();
  expect(Sharing.getResolvedSharedPayloadsAsync).not.toHaveBeenCalled();
  expect(Sharing.clearSharedPayloads).not.toHaveBeenCalled();
  expect(app.triggerAppEvent).toHaveBeenCalledWith({
    name: 'onShare',
    event: {
      text: null,
      urls: [],
      files: [
        {
          name: 'photo.jpg',
          mimeType: 'image/jpeg',
          size: null,
          uri: 'file:///dev/photo.jpg',
          type: 'file',
        },
      ],
    },
  });
});
