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

import GoogleCloudStorageBucket from './GoogleCloudStorageBucket.js';

const schema = GoogleCloudStorageBucket.schema;

test('All requests are present', () => {
  expect(GoogleCloudStorageBucket.requests.GcsGetObject).toBeDefined();
  expect(GoogleCloudStorageBucket.requests.GcsPutObject).toBeDefined();
  expect(GoogleCloudStorageBucket.requests.GcsSignedGetUrl).toBeDefined();
  expect(GoogleCloudStorageBucket.requests.GcsSignedPostPolicy).toBeDefined();
});

test('valid connection schema', () => {
  const connection = {
    bucket: 'bucket',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema, all properties', () => {
  const connection = {
    bucket: 'bucket',
    client_email: 'client_email',
    private_key: 'private_key',
    projectId: 'projectId',
    publicUrlBase: 'https://cdn.example.com',
    read: true,
    write: true,
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('bucket missing', () => {
  const connection = {};
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleCloudStorageBucket connection should have required property "bucket".'
  );
});

test('bucket is not a string', () => {
  const connection = { bucket: true };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleCloudStorageBucket connection property "bucket" should be a string.'
  );
});

test('client_email is not a string', () => {
  const connection = { bucket: 'bucket', client_email: true };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleCloudStorageBucket connection property "client_email" should be a string.'
  );
});

test('private_key is not a string', () => {
  const connection = { bucket: 'bucket', private_key: true };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleCloudStorageBucket connection property "private_key" should be a string.'
  );
});

test('projectId is not a string', () => {
  const connection = { bucket: 'bucket', projectId: true };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleCloudStorageBucket connection property "projectId" should be a string.'
  );
});

test('publicUrlBase is not a string', () => {
  const connection = { bucket: 'bucket', publicUrlBase: true };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleCloudStorageBucket connection property "publicUrlBase" should be a string.'
  );
});

test('read is not a boolean', () => {
  const connection = { bucket: 'bucket', read: 'read' };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleCloudStorageBucket connection property "read" should be a boolean.'
  );
});

test('write is not a boolean', () => {
  const connection = { bucket: 'bucket', write: 'write' };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleCloudStorageBucket connection property "write" should be a boolean.'
  );
});
