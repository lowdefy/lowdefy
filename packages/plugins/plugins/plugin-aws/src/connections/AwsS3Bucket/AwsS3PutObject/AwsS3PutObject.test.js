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
const mockPutObjectCommand = jest.fn();

jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation((...args) => {
    mockS3ClientConstructor(...args);
    return { send: (...sendArgs) => mockSend(...sendArgs) };
  }),
  PutObjectCommand: jest.fn().mockImplementation((params) => {
    mockPutObjectCommand(params);
    return params;
  }),
}));

const { default: AwsS3PutObject } = await import('./AwsS3PutObject.js');

const schema = AwsS3PutObject.schema;
const { checkRead, checkWrite } = AwsS3PutObject.meta;

beforeEach(() => {
  mockSend.mockReset();
  mockS3ClientConstructor.mockReset();
  mockPutObjectCommand.mockReset();
});

test('AwsS3PutObject decodes base64 content and writes the object', async () => {
  const content = Buffer.from('file content').toString('base64');
  const request = { key: 'key', content };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
    write: true,
  };
  const res = await AwsS3PutObject({ request, connection });
  expect(mockS3ClientConstructor.mock.calls).toEqual([
    [
      {
        credentials: {
          accessKeyId: 'accessKeyId',
          secretAccessKey: 'secretAccessKey',
        },
        region: 'region',
      },
    ],
  ]);
  const params = mockPutObjectCommand.mock.calls[0][0];
  expect(params.Bucket).toEqual('bucket');
  expect(params.Key).toEqual('key');
  expect(Buffer.isBuffer(params.Body)).toBe(true);
  expect(params.Body.toString('utf8')).toEqual('file content');
  expect(res).toEqual({ bucket: 'bucket', key: 'key' });
});

test('AwsS3PutObject sets contentType and acl when provided', async () => {
  const content = Buffer.from('file content').toString('base64');
  const request = { key: 'key', content, contentType: 'text/plain', acl: 'public-read' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
    write: true,
  };
  await AwsS3PutObject({ request, connection });
  const params = mockPutObjectCommand.mock.calls[0][0];
  expect(params.ContentType).toEqual('text/plain');
  expect(params.ACL).toEqual('public-read');
});

test('AwsS3PutObject passes endpoint and forcePathStyle to the S3 client', async () => {
  const content = Buffer.from('file content').toString('base64');
  const request = { key: 'key', content };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'auto',
    bucket: 'bucket',
    endpoint: 'https://account.r2.cloudflarestorage.com',
    forcePathStyle: true,
    write: true,
  };
  await AwsS3PutObject({ request, connection });
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
  const request = { key: 'key', content: 'content' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
    write: true,
  };
  await expect(AwsS3PutObject({ request, connection })).rejects.toThrow('Test S3 client error.');
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
    'AwsS3PutObject request properties should be an object.'
  );
});

test('Request key missing', async () => {
  const request = { content: 'content' };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PutObject request should have required property "key".'
  );
});

test('Request content missing', async () => {
  const request = { key: 'key' };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PutObject request should have required property "content".'
  );
});

test('Request key not a string', async () => {
  const request = { key: true, content: 'content' };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PutObject request property "key" should be a string.'
  );
});

test('Request content not a string', async () => {
  const request = { key: 'key', content: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PutObject request property "content" should be a string.'
  );
});

test('Request contentType not a string', async () => {
  const request = { key: 'key', content: 'content', contentType: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PutObject request property "contentType" should be a string.'
  );
});

test('Request acl not an allowed value', async () => {
  const request = { key: 'key', content: 'content', acl: 'acl' };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PutObject request property "acl" is not one of "private", "public-read", "public-read-write", "aws-exec-read", "authenticated-read", "bucket-owner-read", "bucket-owner-full-control".'
  );
});
