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

import AwsS3Bucket from './AwsS3Bucket.js';

const schema = AwsS3Bucket.schema;

test('All requests are present', () => {
  expect(AwsS3Bucket.requests.AwsS3PresignedGetObject).toBeDefined();
  expect(AwsS3Bucket.requests.AwsS3PresignedPostPolicy).toBeDefined();
});

test('valid connection schema', () => {
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema, all properties', () => {
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
    read: true,
    write: true,
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('accessKeyId missing', () => {
  const connection = {
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AwsS3Bucket connection should have required property "accessKeyId".'
  );
});

test('accessKeyId is not a string', () => {
  const connection = {
    accessKeyId: true,
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AwsS3Bucket connection property "accessKeyId" should be a string.'
  );
});

test('secretAccessKey missing', () => {
  const connection = {
    accessKeyId: 'accessKeyId',
    region: 'region',
    bucket: 'bucket',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AwsS3Bucket connection should have required property "secretAccessKey".'
  );
});

test('secretAccessKey is not a string', () => {
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: true,
    region: 'region',
    bucket: 'bucket',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AwsS3Bucket connection property "secretAccessKey" should be a string.'
  );
});

test('region missing', () => {
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    bucket: 'bucket',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AwsS3Bucket connection should have required property "region".'
  );
});

test('region is not a string', () => {
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: true,
    bucket: 'bucket',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AwsS3Bucket connection property "region" should be a string.'
  );
});

test('bucket missing', () => {
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AwsS3Bucket connection should have required property "bucket".'
  );
});

test('bucket is not a string', () => {
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: true,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AwsS3Bucket connection property "bucket" should be a string.'
  );
});

test('read is not a boolean', () => {
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
    read: 'read',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AwsS3Bucket connection property "read" should be a boolean.'
  );
});

test('write is not a boolean', () => {
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
    write: 'write',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AwsS3Bucket connection property "write" should be a boolean.'
  );
});
