/*
  Copyright 2020-2024 Lowdefy, Inc

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
import AWS from 'aws-sdk';

import AwsS3PresignedGetObject from './AwsS3PresignedGetObject.js';

jest.mock('aws-sdk');

const schema = AwsS3PresignedGetObject.schema;
const { checkRead, checkWrite } = AwsS3PresignedGetObject.meta;

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

test('AwsS3PresignedGetObject', () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    write: true,
    bucket: 'bucket',
  };
  const res = AwsS3PresignedGetObject({ request, connection });
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

test('AwsS3PresignedGetObject options ', async () => {
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
  const res = AwsS3PresignedGetObject({ request, connection });
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

test('checkRead should be true', async () => {
  expect(checkRead).toBe(true);
});

test('checkWrite should be false', async () => {
  expect(checkWrite).toBe(false);
});

test('Error from s3 client', async () => {
  mockGetSignedUrl.mockImplementation(() => {
    throw new Error('Test S3 client error.');
  });
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
  };
  await expect(() => AwsS3PresignedGetObject({ request, connection })).toThrow(
    'Test S3 client error.'
  );
});

test('Request properties is not an object', async () => {
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedGetObject request properties should be an object.'
  );
});

test('Request key missing', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedGetObject request should have required property "key".'
  );
});

test('Request expires property not a number', async () => {
  const request = { key: 'key', expires: 'expires' };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedGetObject request property "expires" should be a number.'
  );
});

test('Request key not a string', async () => {
  const request = { key: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedGetObject request property "key" should be a string.'
  );
});

test('Request responseContentDisposition not a string', async () => {
  const request = { key: 'key', responseContentDisposition: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedGetObject request property "responseContentDisposition" should be a string.'
  );
});

test('Request responseContentType not a string', async () => {
  const request = { key: 'key', responseContentType: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedGetObject request property "responseContentType" should be a string.'
  );
});

test('Request versionId not a string', async () => {
  const request = { key: 'key', versionId: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedGetObject request property "versionId" should be a string.'
  );
});
