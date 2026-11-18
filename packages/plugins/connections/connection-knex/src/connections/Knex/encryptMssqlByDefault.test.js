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

import knex from 'knex';
import { afterEach, expect, test } from 'vitest';

import encryptMssqlByDefault from './encryptMssqlByDefault.js';

// Real knex instances, so the tests check the tedious config knex's mssql dialect builds. knex
// does not connect until a query runs.
const knexClients = [];

function tediousOptions(connection) {
  const knexClient = encryptMssqlByDefault(knex({ client: 'mssql', connection }));
  knexClients.push(knexClient);
  return knexClient.client._generateConnection().options;
}

afterEach(async () => {
  await Promise.all(knexClients.splice(0).map((knexClient) => knexClient.destroy()));
});

test('encryptMssqlByDefault turns encryption on when the connection does not set encrypt', () => {
  const options = tediousOptions({ server: 'server', database: 'db' });
  expect(options.encrypt).toBe(true);
  expect(options.trustServerCertificate).toBe(false);
});

test('encryptMssqlByDefault keeps other connection options when it turns encryption on', () => {
  const options = tediousOptions({
    server: 'server',
    options: { trustServerCertificate: true, appName: 'app' },
  });
  expect(options.encrypt).toBe(true);
  expect(options.trustServerCertificate).toBe(true);
  expect(options.appName).toBe('app');
});

test('encryptMssqlByDefault respects encrypt false in connection options', () => {
  const options = tediousOptions({ server: 'server', options: { encrypt: false } });
  expect(options.encrypt).toBe(false);
});

test('encryptMssqlByDefault respects encrypt false set directly on the connection', () => {
  const options = tediousOptions({ server: 'server', encrypt: false });
  expect(options.encrypt).toBe(false);
});

test('encryptMssqlByDefault respects encrypt false in a connection string', () => {
  const options = tediousOptions('mssql://user:password@server:1433/db?encrypt=false');
  expect(options.encrypt).toBe(false);
});

test('encryptMssqlByDefault respects encrypt false in connection string options', () => {
  const options = tediousOptions('mssql://user:password@server:1433/db?options={"encrypt":false}');
  expect(options.encrypt).toBe(false);
});

test('encryptMssqlByDefault turns encryption on for a connection string that does not set encrypt', () => {
  const options = tediousOptions('mssql://user:password@server:1433/db');
  expect(options.encrypt).toBe(true);
});

test('encryptMssqlByDefault keeps encrypt true set on the connection', () => {
  expect(tediousOptions({ server: 'server', encrypt: true }).encrypt).toBe(true);
  expect(tediousOptions({ server: 'server', options: { encrypt: true } }).encrypt).toBe(true);
});

test('encryptMssqlByDefault keeps encrypt strict set in connection options', () => {
  const options = tediousOptions({ server: 'server', options: { encrypt: 'strict' } });
  expect(options.encrypt).toBe('strict');
});
