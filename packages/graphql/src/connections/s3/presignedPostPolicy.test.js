/*
  Copyright 2020 Lowdefy, Inc

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

import AWS from 'aws-sdk';
import presignedPostPolicy from './presignedPostPolicy';
import { ConfigurationError, RequestError } from '../../context/errors';

jest.mock('aws-sdk');

const context = { ConfigurationError, RequestError };

const mockCreatePresignedPost = jest.fn();
const createPresignedPostMockImp = () => 'res';
const mockS3Constructor = jest.fn();
const s3ConstructorMockImp = () => ({
  createPresignedPost: mockCreatePresignedPost,
});

AWS.S3 = mockS3Constructor;

beforeEach(() => {
  mockCreatePresignedPost.mockReset();
  mockS3Constructor.mockReset();
  mockCreatePresignedPost.mockImplementation(createPresignedPostMockImp);
  mockS3Constructor.mockImplementation(s3ConstructorMockImp);
});

test('presignedPostPolicy', () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    write: true,
    bucket: 'bucket',
  };
  const res = presignedPostPolicy({ request, connection, context });
  expect(mockS3Constructor.mock.calls).toEqual([
    [
      {
        accessKeyId: 'accessKeyId',
        bucket: 'bucket',
        region: 'region',
        secretAccessKey: 'secretAccessKey',
      },
    ],
  ]);
  expect(mockCreatePresignedPost.mock.calls).toEqual([
    [
      {
        Bucket: 'bucket',
        Fields: {
          key: 'key',
        },
      },
    ],
  ]);
  expect(res).toEqual('res');
});

test('presignedPostPolicy options ', async () => {
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
  const res = presignedPostPolicy({ request, connection, context });
  expect(mockS3Constructor.mock.calls).toEqual([
    [
      {
        accessKeyId: 'accessKeyId',
        bucket: 'bucket',
        region: 'region',
        secretAccessKey: 'secretAccessKey',
      },
    ],
  ]);
  expect(mockCreatePresignedPost.mock.calls).toEqual([
    [
      {
        Bucket: 'bucket',
        Conditions: [['condition']],
        Expires: 1,
        Fields: {
          key: 'key',
          acl: 'private',
        },
      },
    ],
  ]);
  expect(res).toEqual('res');
});

test('bucket with write false', async () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    write: false,
    bucket: 'bucket',
  };
  await expect(() => presignedPostPolicy({ request, connection, context })).toThrow(
    ConfigurationError
  );
  await expect(() => presignedPostPolicy({ request, connection, context })).toThrow(
    'AWS S3 Bucket does not allow writes'
  );
});

test('bucket with no write specified', async () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
  };
  await expect(() => presignedPostPolicy({ request, connection, context })).toThrow(
    ConfigurationError
  );
  await expect(() => presignedPostPolicy({ request, connection, context })).toThrow(
    'AWS S3 Bucket does not allow writes'
  );
});

test('accessKeyId missing', async () => {
  const request = { key: 'key' };
  const connection = {
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
    write: true,
  };
  await expect(() => presignedPostPolicy({ request, connection, context })).toThrow(
    ConfigurationError
  );
});

test('secretAccessKey missing', async () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    region: 'region',
    bucket: 'bucket',
    write: true,
  };
  await expect(() => presignedPostPolicy({ request, connection, context })).toThrow(
    ConfigurationError
  );
});

test('region missing', async () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    bucket: 'bucket',
    write: true,
  };
  await expect(() => presignedPostPolicy({ request, connection, context })).toThrow(
    ConfigurationError
  );
});

test('bucket missing', async () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    write: true,
  };
  await expect(() => presignedPostPolicy({ request, connection, context })).toThrow(
    ConfigurationError
  );
});

test('key missing', async () => {
  const request = {};
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
    write: true,
  };
  await expect(() => presignedPostPolicy({ request, connection, context })).toThrow(
    ConfigurationError
  );
});

test('acl not an allowed value', async () => {
  const request = { key: 'key', acl: 'acl' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
    write: true,
  };
  await expect(() => presignedPostPolicy({ request, connection, context })).toThrow(
    ConfigurationError
  );
});

test('conditions invalid value', async () => {
  const request = { key: 'key', conditions: 'conditions' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
    write: true,
  };
  await expect(() => presignedPostPolicy({ request, connection, context })).toThrow(
    ConfigurationError
  );
});

test('expires invalid value', async () => {
  const request = { key: 'key', expires: 'expires' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
    write: true,
  };
  await expect(() => presignedPostPolicy({ request, connection, context })).toThrow(
    ConfigurationError
  );
});
