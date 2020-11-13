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
import presignedGetObject from './presignedGetObject';
import { ConfigurationError, RequestError } from '../../context/errors';

jest.mock('aws-sdk');

const context = { ConfigurationError, RequestError };

const mockGetSignedUrl = jest.fn();
const getSignedUrlMockImp = () => 'res';
const mockS3Constructor = jest.fn();
const s3ConstructorMockImp = () => ({
  getSignedUrl: mockGetSignedUrl,
});

AWS.S3 = mockS3Constructor;

beforeEach(() => {
  mockGetSignedUrl.mockReset();
  mockS3Constructor.mockReset();
  mockGetSignedUrl.mockImplementation(getSignedUrlMockImp);
  mockS3Constructor.mockImplementation(s3ConstructorMockImp);
});

test('presignedGetObject', () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    write: true,
    bucket: 'bucket',
  };
  const res = presignedGetObject({ request, connection, context });
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
  expect(mockGetSignedUrl.mock.calls).toEqual([
    [
      'getObject',
      {
        Bucket: 'bucket',
        Key: 'key',
      },
    ],
  ]);
  expect(res).toEqual('res');
});

test('presignedGetObject options ', async () => {
  const request = {
    key: 'key',
    versionId: 'versionId',
    expires: 1,
    responseContentDisposition: 'responseContentDisposition',
    responseContentType: 'responseContentType',
  };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
  };
  const res = presignedGetObject({ request, connection, context });
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
  expect(mockGetSignedUrl.mock.calls).toEqual([
    [
      'getObject',
      {
        Key: 'key',
        Bucket: 'bucket',
        VersionId: 'versionId',
        Expires: 1,
        ResponseContentDisposition: 'responseContentDisposition',
        ResponseContentType: 'responseContentType',
      },
    ],
  ]);
  expect(res).toEqual('res');
});

test('bucket with read false', async () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
    read: false,
  };
  await expect(() => presignedGetObject({ request, connection, context })).toThrow(
    ConfigurationError
  );
  await expect(() => presignedGetObject({ request, connection, context })).toThrow(
    'AWS S3 Bucket does not allow reads'
  );
});

test('bucket with no read specified', async () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
  };
  const res = presignedGetObject({ request, connection, context });
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
  expect(mockGetSignedUrl.mock.calls).toEqual([
    [
      'getObject',
      {
        Bucket: 'bucket',
        Key: 'key',
      },
    ],
  ]);
  expect(res).toEqual('res');
});

test('bucket with read true specified', async () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
    read: true,
  };
  const res = presignedGetObject({ request, connection, context });
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
  expect(mockGetSignedUrl.mock.calls).toEqual([
    [
      'getObject',
      {
        Bucket: 'bucket',
        Key: 'key',
      },
    ],
  ]);
  expect(res).toEqual('res');
});

test('accessKeyId missing', async () => {
  const request = { key: 'key' };
  const connection = {
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
  };
  await expect(() => presignedGetObject({ request, connection, context })).toThrow(
    ConfigurationError
  );
});

test('secretAccessKey missing', async () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    region: 'region',
    bucket: 'bucket',
  };
  await expect(() => presignedGetObject({ request, connection, context })).toThrow(
    ConfigurationError
  );
});

test('region missing', async () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    bucket: 'bucket',
  };
  await expect(() => presignedGetObject({ request, connection, context })).toThrow(
    ConfigurationError
  );
});

test('bucket missing', async () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
  };
  await expect(() => presignedGetObject({ request, connection, context })).toThrow(
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
  };
  await expect(() => presignedGetObject({ request, connection, context })).toThrow(
    ConfigurationError
  );
});

test('versionId not an allowed value', async () => {
  const request = { key: 'key', versionId: true };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
    write: true,
  };
  await expect(() => presignedGetObject({ request, connection, context })).toThrow(
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
  await expect(() => presignedGetObject({ request, connection, context })).toThrow(
    ConfigurationError
  );
});
