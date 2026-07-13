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

import { jest } from '@jest/globals';
import { validate } from '@lowdefy/ajv';

const mockSave = jest.fn();
const mockFile = jest.fn();
const mockBucket = jest.fn();
const mockStorageConstructor = jest.fn();

jest.unstable_mockModule('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation((...args) => {
    mockStorageConstructor(...args);
    return { bucket: mockBucket };
  }),
}));

const { default: GcsPutObject } = await import('./GcsPutObject.js');

const schema = GcsPutObject.schema;
const { checkRead, checkWrite } = GcsPutObject.meta;

beforeEach(() => {
  mockSave.mockReset();
  mockFile.mockReset();
  mockBucket.mockReset();
  mockStorageConstructor.mockReset();
  mockBucket.mockImplementation(() => ({ file: mockFile }));
  mockFile.mockImplementation(() => ({ save: mockSave }));
});

test('GcsPutObject decodes base64 content and writes the object', async () => {
  const content = Buffer.from('file content').toString('base64');
  const request = { key: 'key', content };
  const connection = { bucket: 'bucket', write: true };
  const res = await GcsPutObject({ request, connection });
  expect(mockBucket.mock.calls).toEqual([['bucket']]);
  expect(mockFile.mock.calls).toEqual([['key']]);
  const [body, options] = mockSave.mock.calls[0];
  expect(Buffer.isBuffer(body)).toBe(true);
  expect(body.toString('utf8')).toEqual('file content');
  expect(options).toEqual({ resumable: false });
  expect(res).toEqual({ bucket: 'bucket', key: 'key' });
});

test('GcsPutObject sets contentType and public when provided', async () => {
  const content = Buffer.from('file content').toString('base64');
  const request = { key: 'key', content, contentType: 'text/plain', public: true };
  const connection = { bucket: 'bucket', write: true };
  await GcsPutObject({ request, connection });
  const options = mockSave.mock.calls[0][1];
  expect(options).toEqual({ resumable: false, contentType: 'text/plain', public: true });
});

test('Error from storage client', async () => {
  mockSave.mockImplementation(() => {
    throw new Error('Test GCS client error.');
  });
  const request = { key: 'key', content: 'content' };
  const connection = { bucket: 'bucket', write: true };
  await expect(GcsPutObject({ request, connection })).rejects.toThrow('Test GCS client error.');
});

test('checkRead should be false', async () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  expect(checkWrite).toBe(true);
});

test('Request properties is not an object', async () => {
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'GcsPutObject request properties should be an object.'
  );
});

test('Request key missing', async () => {
  const request = { content: 'content' };
  expect(() => validate({ schema, data: request })).toThrow(
    'GcsPutObject request should have required property "key".'
  );
});

test('Request content missing', async () => {
  const request = { key: 'key' };
  expect(() => validate({ schema, data: request })).toThrow(
    'GcsPutObject request should have required property "content".'
  );
});

test('Request content not a string', async () => {
  const request = { key: 'key', content: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'GcsPutObject request property "content" should be a string.'
  );
});

test('Request contentType not a string', async () => {
  const request = { key: 'key', content: 'content', contentType: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'GcsPutObject request property "contentType" should be a string.'
  );
});
