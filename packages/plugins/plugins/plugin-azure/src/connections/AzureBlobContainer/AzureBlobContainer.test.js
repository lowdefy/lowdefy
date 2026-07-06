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

import AzureBlobContainer from './AzureBlobContainer.js';

const schema = AzureBlobContainer.schema;

test('All requests are present', () => {
  expect(AzureBlobContainer.requests.AzureBlobDownloadSas).toBeDefined();
  expect(AzureBlobContainer.requests.AzureBlobPut).toBeDefined();
  expect(AzureBlobContainer.requests.AzureBlobUploadSas).toBeDefined();
});

test('valid connection schema', () => {
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema, all properties', () => {
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
    publicUrlBase: 'https://cdn.example.com',
    read: true,
    write: true,
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('account missing', () => {
  const connection = {
    accountKey: 'accountKey',
    container: 'container',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AzureBlobContainer connection should have required property "account".'
  );
});

test('account is not a string', () => {
  const connection = {
    account: true,
    accountKey: 'accountKey',
    container: 'container',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AzureBlobContainer connection property "account" should be a string.'
  );
});

test('accountKey missing', () => {
  const connection = {
    account: 'account',
    container: 'container',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AzureBlobContainer connection should have required property "accountKey".'
  );
});

test('accountKey is not a string', () => {
  const connection = {
    account: 'account',
    accountKey: true,
    container: 'container',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AzureBlobContainer connection property "accountKey" should be a string.'
  );
});

test('container missing', () => {
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AzureBlobContainer connection should have required property "container".'
  );
});

test('container is not a string', () => {
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: true,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AzureBlobContainer connection property "container" should be a string.'
  );
});

test('publicUrlBase is not a string', () => {
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
    publicUrlBase: true,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AzureBlobContainer connection property "publicUrlBase" should be a string.'
  );
});

test('read is not a boolean', () => {
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
    read: 'read',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AzureBlobContainer connection property "read" should be a boolean.'
  );
});

test('write is not a boolean', () => {
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
    write: 'write',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AzureBlobContainer connection property "write" should be a boolean.'
  );
});
