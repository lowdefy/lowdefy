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

import { vi, beforeEach, expect, test } from 'vitest';

const mockGetUploadPolicy = vi.fn();
const mockUploadFile = vi.fn();
vi.doMock('@lowdefy/blocks-files/utils/getUploadPolicy.js', () => ({
  default: mockGetUploadPolicy,
}));
vi.doMock('@lowdefy/blocks-files/utils/uploadFile.js', () => ({ default: mockUploadFile }));
vi.doMock('@lowdefy/blocks-files/utils/getLegacyObjectUrl.js', () => ({
  default: ({ descriptor }) => `https://${descriptor.bucket}.s3.amazonaws.com/${descriptor.key}`,
}));

const { default: fileUpload } = await import('./fileUpload.js');

const descriptor = { bucket: 'files', key: 'log-events/2024/x y+z.png' };

function createMethods() {
  return {
    triggerEvent: vi.fn(async () => ({
      success: true,
      responses: { __getDownloadPolicy: { response: ['https://files.test/presigned'] } },
    })),
  };
}

beforeEach(() => {
  mockGetUploadPolicy.mockResolvedValue(descriptor);
  mockUploadFile.mockResolvedValue(undefined);
});

test('imageSrc sets the inserted src and no download request runs', async () => {
  const methods = createMethods();
  const file = { name: 'x y+z.png', type: 'image/png' };
  const imageSrc = vi.fn(({ key }) => `/api/endpoints/files/inline/${key}`);
  const src = await fileUpload({ file, methods, hasDownloadRequest: true, imageSrc });
  expect(src).toBe('/api/endpoints/files/inline/log-events/2024/x y+z.png');
  expect(file.url).toBe(src);
  expect(imageSrc).toHaveBeenCalledWith({
    key: 'log-events/2024/x y+z.png',
    bucket: 'files',
    name: 'x y+z.png',
    type: 'image/png',
  });
  expect(mockUploadFile).toHaveBeenCalled();
  expect(methods.triggerEvent).not.toHaveBeenCalled();
});

test('imageSrc that returns no string throws', async () => {
  const file = { name: 'x.png', type: 'image/png' };
  await expect(
    fileUpload({ file, methods: createMethods(), hasDownloadRequest: false, imageSrc: () => null })
  ).rejects.toThrow('Tiptap "imageSrc" must return a non-empty string. Received null.');
});

test('without imageSrc the download request resolves the src', async () => {
  const methods = createMethods();
  const file = { name: 'x.png', type: 'image/png' };
  const src = await fileUpload({ file, methods, hasDownloadRequest: true });
  expect(src).toBe('https://files.test/presigned');
  expect(methods.triggerEvent).toHaveBeenCalledWith({
    name: '__getDownloadPolicy',
    event: {
      file: { bucket: 'files', key: 'log-events/2024/x y+z.png', name: 'x.png', type: 'image/png' },
    },
  });
});

test('with neither imageSrc nor a download request the legacy object URL is used', async () => {
  const methods = createMethods();
  const src = await fileUpload({ file: { name: 'x.png' }, methods, hasDownloadRequest: false });
  expect(src).toBe('https://files.s3.amazonaws.com/log-events/2024/x y+z.png');
  expect(methods.triggerEvent).not.toHaveBeenCalled();
});
