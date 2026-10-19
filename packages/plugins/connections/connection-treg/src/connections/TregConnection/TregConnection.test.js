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

import TregConnection from './TregConnection.js';

const { schema } = TregConnection;

test('TregConnection has the treg requests', () => {
  expect(Object.keys(TregConnection.requests).sort()).toEqual([
    'TregBalance',
    'TregCall',
    'TregCatalogGet',
    'TregCatalogSearch',
  ]);
  Object.values(TregConnection.requests).forEach((request) => {
    expect(request.schema).toBeDefined();
    expect(request.meta).toEqual({ checkRead: false, checkWrite: false });
  });
});

test('TregConnection schema accepts a token alone', () => {
  expect(validate({ schema, data: { token: 't' } })).toEqual({ valid: true });
});

test('TregConnection schema accepts every property', () => {
  expect(
    validate({
      schema,
      data: {
        token: 't',
        org: 'acme',
        baseUrl: 'https://treg.example.com/api',
        timeout: 10000,
        maxCost: 0.25,
        meta: { app: 'crm', tenant_id: 42 },
        allowCustomTools: true,
      },
    })
  ).toEqual({ valid: true });
});

test('TregConnection schema requires a token', () => {
  expect(() => validate({ schema, data: {} })).toThrow(
    'TregConnection should have required property "token".'
  );
  expect(() => validate({ schema, data: { token: '' } })).toThrow(
    'TregConnection property "token" should not be empty.'
  );
});

test.each([
  'http://localhost:8000',
  'http://127.0.0.1:3201',
  'http://[::1]:9000/treg',
  'https://treg.to',
])('TregConnection schema accepts the base URL %s', (baseUrl) => {
  expect(validate({ schema, data: { token: 't', baseUrl } })).toEqual({ valid: true });
});

test.each([
  'http://treg.to',
  'http://localhost.evil.example',
  'https://user:pass@treg.to',
  'https://treg.to/?x=1',
  'ftp://treg.to',
  'treg.to',
])('TregConnection schema refuses the base URL %s', (baseUrl) => {
  expect(() => validate({ schema, data: { token: 't', baseUrl } })).toThrow(
    'TregConnection property "baseUrl" should be an https URL (http is only allowed on localhost), with no query or credentials.'
  );
});

test('TregConnection schema checks meta tags the way treg stores them', () => {
  expect(() => validate({ schema, data: { token: 't', meta: { Customer: 'a' } } })).toThrow(
    'TregConnection property "meta" keys should be 1 to 32 lowercase letters, digits or "_".'
  );
  expect(() => validate({ schema, data: { token: 't', meta: { customer: 'a@b.com' } } })).toThrow(
    'TregConnection property "meta" values should be strings of up to 128 letters, digits or ". _ - :", or integers.'
  );
  expect(() =>
    validate({
      schema,
      data: { token: 't', meta: { a: '1', b: '2', c: '3', d: '4', e: '5', f: '6' } },
    })
  ).toThrow('TregConnection property "meta" should have at most 5 tags.');
});

test('TregConnection schema refuses unknown properties', () => {
  expect(() => validate({ schema, data: { token: 't', apiKey: 'x' } })).toThrow(
    'TregConnection should only have "token", "org", "baseUrl", "timeout", "maxCost", "meta" and "allowCustomTools".'
  );
});
