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
const mockHeadObjectCommand = jest.fn();

jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation((...args) => {
    mockS3ClientConstructor(...args);
    return { send: (...sendArgs) => mockSend(...sendArgs) };
  }),
  HeadObjectCommand: jest.fn().mockImplementation((params) => {
    mockHeadObjectCommand(params);
    return params;
  }),
}));

const { default: AwsS3HeadObject } = await import('./AwsS3HeadObject.js');

const schema = AwsS3HeadObject.schema;
const { checkRead, checkWrite } = AwsS3HeadObject.meta;

const lastModified = new Date('2026-09-27T10:00:00.000Z');

const connection = {
  accessKeyId: 'accessKeyId',
  secretAccessKey: 'secretAccessKey',
  region: 'region',
  bucket: 'bucket',
};

function createS3Error({ name, httpStatusCode }) {
  const error = new Error(name);
  error.name = name;
  error.$metadata = { httpStatusCode };
  return error;
}

beforeEach(() => {
  mockSend.mockReset();
  mockS3ClientConstructor.mockReset();
  mockHeadObjectCommand.mockReset();
  mockSend.mockImplementation(() => ({
    ContentLength: 2048,
    ContentType: 'image/png',
    ETag: '"etag"',
    LastModified: lastModified,
  }));
});

test('AwsS3HeadObject returns the metadata of an object that exists', async () => {
  const request = { key: 'key' };
  const res = await AwsS3HeadObject({ request, connection });
  expect(mockHeadObjectCommand.mock.calls).toEqual([[{ Bucket: 'bucket', Key: 'key' }]]);
  expect(res).toEqual({
    exists: true,
    bucket: 'bucket',
    key: 'key',
    size: 2048,
    contentType: 'image/png',
    etag: '"etag"',
    lastModified,
  });
});

test('AwsS3HeadObject passes versionId when provided and returns the version', async () => {
  mockSend.mockImplementation(() => ({
    ContentLength: 2048,
    ContentType: 'image/png',
    ETag: '"etag"',
    LastModified: lastModified,
    VersionId: 'versionId',
  }));
  const request = { key: 'key', versionId: 'versionId' };
  const res = await AwsS3HeadObject({ request, connection });
  expect(mockHeadObjectCommand.mock.calls).toEqual([
    [{ Bucket: 'bucket', Key: 'key', VersionId: 'versionId' }],
  ]);
  expect(res).toEqual({
    exists: true,
    bucket: 'bucket',
    key: 'key',
    size: 2048,
    contentType: 'image/png',
    etag: '"etag"',
    lastModified,
    versionId: 'versionId',
  });
});

test('AwsS3HeadObject omits contentType when the response has none', async () => {
  mockSend.mockImplementation(() => ({
    ContentLength: 1,
    ETag: '"etag"',
    LastModified: lastModified,
  }));
  const request = { key: 'key' };
  const res = await AwsS3HeadObject({ request, connection });
  expect(res).toEqual({
    exists: true,
    bucket: 'bucket',
    key: 'key',
    size: 1,
    etag: '"etag"',
    lastModified,
  });
});

test('AwsS3HeadObject returns exists false when S3 answers not found', async () => {
  mockSend.mockImplementation(() => {
    throw createS3Error({ name: 'NotFound', httpStatusCode: 404 });
  });
  const request = { key: 'missing' };
  const res = await AwsS3HeadObject({ request, connection });
  expect(res).toEqual({ exists: false, bucket: 'bucket', key: 'missing' });
});

test('AwsS3HeadObject returns exists false when a provider names the 404 NoSuchKey', async () => {
  mockSend.mockImplementation(() => {
    throw createS3Error({ name: 'NoSuchKey', httpStatusCode: 404 });
  });
  const request = { key: 'missing' };
  const res = await AwsS3HeadObject({ request, connection });
  expect(res).toEqual({ exists: false, bucket: 'bucket', key: 'missing' });
});

test('AwsS3HeadObject throws S3 errors other than not found', async () => {
  mockSend.mockImplementation(() => {
    throw createS3Error({ name: 'Forbidden', httpStatusCode: 403 });
  });
  const request = { key: 'key' };
  await expect(AwsS3HeadObject({ request, connection })).rejects.toThrow('Forbidden');
});

test('AwsS3HeadObject throws errors that carry no S3 metadata', async () => {
  mockSend.mockImplementation(() => {
    throw new Error('Test S3 client error.');
  });
  const request = { key: 'key' };
  await expect(AwsS3HeadObject({ request, connection })).rejects.toThrow('Test S3 client error.');
});

test('AwsS3HeadObject passes endpoint and forcePathStyle to the S3 client', async () => {
  const request = { key: 'key' };
  await AwsS3HeadObject({
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

test('checkRead should be true', async () => {
  expect(checkRead).toBe(true);
});

test('checkWrite should be false', async () => {
  expect(checkWrite).toBe(false);
});

test('Request properties is not an object', async () => {
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3HeadObject request properties should be an object.'
  );
});

test('Request key missing', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3HeadObject request should have required property "key".'
  );
});

test('Request key not a string', async () => {
  const request = { key: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3HeadObject request property "key" should be a string.'
  );
});

test('Request versionId not a string', async () => {
  const request = { key: 'key', versionId: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3HeadObject request property "versionId" should be a string.'
  );
});
