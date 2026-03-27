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

import { validate } from '@lowdefy/ajv';

import AwsS3PresignedPostPolicy from './AwsS3PresignedPostPolicy.js';

const mockCreatePresignedPost = jest.fn();
const mockS3ClientConstructor = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation((...args) => {
    mockS3ClientConstructor(...args);
    return {};
  }),
}));

jest.mock('@aws-sdk/s3-presigned-post', () => ({
  createPresignedPost: (...args) => mockCreatePresignedPost(...args),
}));

const schema = AwsS3PresignedPostPolicy.schema;
const { checkRead, checkWrite } = AwsS3PresignedPostPolicy.meta;

const createPresignedPostMockImp = () => 'res';

beforeEach(() => {
  mockCreatePresignedPost.mockReset();
  mockS3ClientConstructor.mockReset();
  mockCreatePresignedPost.mockImplementation(createPresignedPostMockImp);
});

test('AwsS3PresignedPostPolicy', async () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    write: true,
    bucket: 'bucket',
  };
  const res = await AwsS3PresignedPostPolicy({ request, connection });
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
  expect(mockCreatePresignedPost.mock.calls).toEqual([
    [
      {},
      {
        Bucket: 'bucket',
        Key: 'key',
        Fields: {},
      },
    ],
  ]);
  expect(res).toEqual('res');
});

test('AwsS3PresignedPostPolicy options', async () => {
  const request = {
    key: 'key',
    acl: 'private',
    conditions: [['condition']],
    expires: 1,
  };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    write: true,
    bucket: 'bucket',
  };
  const res = await AwsS3PresignedPostPolicy({ request, connection });
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
  expect(mockCreatePresignedPost.mock.calls).toEqual([
    [
      {},
      {
        Bucket: 'bucket',
        Key: 'key',
        Conditions: [['condition']],
        Expires: 1,
        Fields: {
          acl: 'private',
        },
      },
    ],
  ]);
  expect(res).toEqual('res');
});

test('Error from s3 client', async () => {
  mockCreatePresignedPost.mockImplementation(() => {
    throw new Error('Test S3 client error.');
  });
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
    write: true,
  };
  await expect(AwsS3PresignedPostPolicy({ request, connection })).rejects.toThrow(
    'Test S3 client error.'
  );
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
    'AwsS3PresignedPostPolicy request properties should be an object.'
  );
});

test('Request property key missing', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedPostPolicy request should have required property "key".'
  );
});

test('Request property key not a string', async () => {
  const request = { key: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedPostPolicy request property "key" should be a string.'
  );
});

test('Request property acl not a string', async () => {
  const request = { key: 'key', acl: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedPostPolicy request property "acl" is not one of "private", "public-read", "public-read-write", "aws-exec-read", "authenticated-read", "bucket-owner-read", "bucket-owner-full-control".'
  );
});

test('Request property acl not an allowed value', async () => {
  const request = { key: 'key', acl: 'acl' };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedPostPolicy request property "acl" is not one of "private", "public-read", "public-read-write", "aws-exec-read", "authenticated-read", "bucket-owner-read", "bucket-owner-full-control".'
  );
});

test('Request property conditions not an array', async () => {
  const request = { key: 'key', conditions: 'conditions' };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedPostPolicy request property "conditions" should be a array.'
  );
});

test('Request property expires not a number', async () => {
  const request = { key: 'key', expires: 'expires' };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedPostPolicy request property "expires" should be a number.'
  );
});
