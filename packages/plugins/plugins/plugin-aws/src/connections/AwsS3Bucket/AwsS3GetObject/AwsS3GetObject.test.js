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

const mockSend = jest.fn();
const mockS3ClientConstructor = jest.fn();
const mockGetObjectCommand = jest.fn();

jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation((...args) => {
    mockS3ClientConstructor(...args);
    return { send: (...sendArgs) => mockSend(...sendArgs) };
  }),
  GetObjectCommand: jest.fn().mockImplementation((params) => {
    mockGetObjectCommand(params);
    return params;
  }),
}));

const { default: AwsS3GetObject } = await import('./AwsS3GetObject.js');

const schema = AwsS3GetObject.schema;
const { checkRead, checkWrite } = AwsS3GetObject.meta;

beforeEach(() => {
  mockSend.mockReset();
  mockS3ClientConstructor.mockReset();
  mockGetObjectCommand.mockReset();
  mockSend.mockImplementation(() => ({
    Body: {
      transformToByteArray: async () => new Uint8Array(Buffer.from('file content')),
    },
    ContentType: 'text/plain',
    ContentLength: 12,
  }));
});

test('AwsS3GetObject reads the object and returns base64 content', async () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
    read: true,
  };
  const res = await AwsS3GetObject({ request, connection });
  expect(mockGetObjectCommand.mock.calls).toEqual([[{ Bucket: 'bucket', Key: 'key' }]]);
  expect(res).toEqual({
    bucket: 'bucket',
    key: 'key',
    content: Buffer.from('file content').toString('base64'),
    contentType: 'text/plain',
    size: 12,
  });
  expect(Buffer.from(res.content, 'base64').toString('utf8')).toEqual('file content');
});

test('AwsS3GetObject passes versionId when provided', async () => {
  const request = { key: 'key', versionId: 'versionId' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
  };
  await AwsS3GetObject({ request, connection });
  expect(mockGetObjectCommand.mock.calls).toEqual([
    [{ Bucket: 'bucket', Key: 'key', VersionId: 'versionId' }],
  ]);
});

test('AwsS3GetObject omits contentType when the response has none and sizes from content', async () => {
  mockSend.mockImplementation(() => ({
    Body: {
      transformToByteArray: async () => new Uint8Array(Buffer.from('x')),
    },
  }));
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
  };
  const res = await AwsS3GetObject({ request, connection });
  expect(res).toEqual({
    bucket: 'bucket',
    key: 'key',
    content: Buffer.from('x').toString('base64'),
    size: 1,
  });
});

test('AwsS3GetObject passes endpoint and forcePathStyle to the S3 client', async () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'auto',
    bucket: 'bucket',
    endpoint: 'https://account.r2.cloudflarestorage.com',
    forcePathStyle: true,
  };
  await AwsS3GetObject({ request, connection });
  expect(mockS3ClientConstructor.mock.calls).toEqual([
    [
      {
        credentials: {
          accessKeyId: 'accessKeyId',
          secretAccessKey: 'secretAccessKey',
        },
        region: 'auto',
        endpoint: 'https://account.r2.cloudflarestorage.com',
        forcePathStyle: true,
      },
    ],
  ]);
});

test('Error from s3 client', async () => {
  mockSend.mockImplementation(() => {
    throw new Error('Test S3 client error.');
  });
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
  };
  await expect(AwsS3GetObject({ request, connection })).rejects.toThrow('Test S3 client error.');
});

test('checkRead should be true', async () => {
  expect(checkRead).toBe(true);
});

test('checkWrite should be false', async () => {
  expect(checkWrite).toBe(false);
});

test('Request properties is not an object', async () => {
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3GetObject request properties should be an object.'
  );
});

test('Request key missing', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3GetObject request should have required property "key".'
  );
});

test('Request key not a string', async () => {
  const request = { key: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3GetObject request property "key" should be a string.'
  );
});

test('Request versionId not a string', async () => {
  const request = { key: 'key', versionId: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3GetObject request property "versionId" should be a string.'
  );
});
