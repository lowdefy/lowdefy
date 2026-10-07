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
const mockDeleteObjectCommand = jest.fn();
const mockDeleteObjectsCommand = jest.fn();

jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation((...args) => {
    mockS3ClientConstructor(...args);
    return { send: (...sendArgs) => mockSend(...sendArgs) };
  }),
  DeleteObjectCommand: jest.fn().mockImplementation((params) => {
    mockDeleteObjectCommand(params);
    return params;
  }),
  DeleteObjectsCommand: jest.fn().mockImplementation((params) => {
    mockDeleteObjectsCommand(params);
    return params;
  }),
}));

const { default: AwsS3DeleteObject } = await import('./AwsS3DeleteObject.js');

const schema = AwsS3DeleteObject.schema;
const { checkRead, checkWrite } = AwsS3DeleteObject.meta;

const connection = {
  accessKeyId: 'accessKeyId',
  secretAccessKey: 'secretAccessKey',
  region: 'region',
  bucket: 'bucket',
  write: true,
};

beforeEach(() => {
  mockSend.mockReset();
  mockS3ClientConstructor.mockReset();
  mockDeleteObjectCommand.mockReset();
  mockDeleteObjectsCommand.mockReset();
  mockSend.mockImplementation(() => ({}));
});

test('AwsS3DeleteObject deletes one key from the connection bucket', async () => {
  const request = { key: 'calls/1/a.png' };
  const res = await AwsS3DeleteObject({ request, connection });
  expect(mockDeleteObjectCommand.mock.calls).toEqual([
    [{ Bucket: 'bucket', Key: 'calls/1/a.png' }],
  ]);
  expect(mockDeleteObjectsCommand).not.toHaveBeenCalled();
  expect(res).toEqual({ bucket: 'bucket', deleted: ['calls/1/a.png'], errors: [] });
});

test('AwsS3DeleteObject deletes several keys from the connection bucket in one call', async () => {
  mockSend.mockImplementation(() => ({
    Deleted: [{ Key: 'a.png' }, { Key: 'b.png' }],
  }));
  const request = { keys: ['a.png', 'b.png'] };
  const res = await AwsS3DeleteObject({ request, connection });
  expect(mockDeleteObjectsCommand.mock.calls).toEqual([
    [
      {
        Bucket: 'bucket',
        Delete: { Objects: [{ Key: 'a.png' }, { Key: 'b.png' }], Quiet: false },
      },
    ],
  ]);
  expect(mockDeleteObjectCommand).not.toHaveBeenCalled();
  expect(res).toEqual({ bucket: 'bucket', deleted: ['a.png', 'b.png'], errors: [] });
});

test('AwsS3DeleteObject returns the keys S3 could not delete as errors', async () => {
  mockSend.mockImplementation(() => ({
    Deleted: [{ Key: 'a.png' }],
    Errors: [{ Key: 'b.png', Code: 'AccessDenied', Message: 'Access Denied' }],
  }));
  const request = { keys: ['a.png', 'b.png'] };
  const res = await AwsS3DeleteObject({ request, connection });
  expect(res).toEqual({
    bucket: 'bucket',
    deleted: ['a.png'],
    errors: [{ key: 'b.png', code: 'AccessDenied', message: 'Access Denied' }],
  });
});

test('AwsS3DeleteObject returns empty lists when S3 answers with neither Deleted nor Errors', async () => {
  const request = { keys: ['a.png'] };
  const res = await AwsS3DeleteObject({ request, connection });
  expect(res).toEqual({ bucket: 'bucket', deleted: [], errors: [] });
});

test('AwsS3DeleteObject throws when the single delete call fails', async () => {
  mockSend.mockImplementation(() => {
    throw new Error('Access Denied');
  });
  const request = { key: 'a.png' };
  await expect(AwsS3DeleteObject({ request, connection })).rejects.toThrow('Access Denied');
});

test('AwsS3DeleteObject throws when the multiple delete call fails', async () => {
  mockSend.mockImplementation(() => {
    throw new Error('NoSuchBucket');
  });
  const request = { keys: ['a.png', 'b.png'] };
  await expect(AwsS3DeleteObject({ request, connection })).rejects.toThrow('NoSuchBucket');
});

test('AwsS3DeleteObject passes endpoint and forcePathStyle to the S3 client', async () => {
  const request = { key: 'key' };
  await AwsS3DeleteObject({
    request,
    connection: {
      ...connection,
      region: 'auto',
      endpoint: 'https://account.r2.cloudflarestorage.com',
      forcePathStyle: true,
    },
  });
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

test('checkRead should be false', async () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  expect(checkWrite).toBe(true);
});

test('Request with key is valid', async () => {
  expect(validate({ schema, data: { key: 'a.png' } })).toEqual({ valid: true });
});

test('Request with keys is valid', async () => {
  expect(validate({ schema, data: { keys: ['a.png', 'b.png'] } })).toEqual({ valid: true });
});

test('Request properties is not an object', async () => {
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3DeleteObject request properties should be an object.'
  );
});

test('Request with neither key nor keys', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3DeleteObject request should have either "key" or "keys", not both.'
  );
});

test('Request with both key and keys', async () => {
  const request = { key: 'a.png', keys: ['b.png'] };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3DeleteObject request should have either "key" or "keys", not both.'
  );
});

test('Request key not a string', async () => {
  const request = { key: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3DeleteObject request property "key" should be a string.'
  );
});

test('Request keys not an array', async () => {
  const request = { keys: 'a.png' };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3DeleteObject request property "keys" should be an array of strings.'
  );
});

test('Request keys holds a value that is not a string', async () => {
  const request = { keys: ['a.png', 1] };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3DeleteObject request property "keys" should be an array of strings.'
  );
});

test('Request keys empty', async () => {
  const request = { keys: [] };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3DeleteObject request property "keys" should have at least 1 key.'
  );
});

test('Request keys over 1000', async () => {
  const request = { keys: Array.from({ length: 1001 }, (_, i) => `key-${i}`) };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3DeleteObject request property "keys" should have at most 1000 keys.'
  );
});

test('Request naming a bucket is refused', async () => {
  const request = { key: 'a.png', bucket: 'other-bucket' };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3DeleteObject request should only have "key" or "keys".'
  );
});
