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

import { ConfigError } from '@lowdefy/errors';

import normalizeConnectionPort from './normalizeConnectionPort.js';

test('normalizeConnectionPort converts a string port to a number', () => {
  const knexClient = { client: { connectionSettings: { host: 'h', port: '45678' } } };
  expect(normalizeConnectionPort(knexClient)).toBe(knexClient);
  expect(knexClient.client.connectionSettings.port).toBe(45678);
});

test('normalizeConnectionPort leaves a numeric port unchanged', () => {
  const knexClient = { client: { connectionSettings: { host: 'h', port: 1433 } } };
  normalizeConnectionPort(knexClient);
  expect(knexClient.client.connectionSettings.port).toBe(1433);
});

test('normalizeConnectionPort leaves settings without a port unchanged', () => {
  const knexClient = { client: { connectionSettings: { filename: ':memory:' } } };
  normalizeConnectionPort(knexClient);
  expect(knexClient.client.connectionSettings).toEqual({ filename: ':memory:' });
});

test('normalizeConnectionPort returns the client when it has no connection settings', () => {
  const knexClient = { client: {} };
  expect(normalizeConnectionPort(knexClient)).toBe(knexClient);
});

test('normalizeConnectionPort throws a ConfigError for a port that is not a number', () => {
  const knexClient = { client: { connectionSettings: { port: 'abc' } } };
  expect(() => normalizeConnectionPort(knexClient)).toThrow(
    'Knex connection port is not a valid port number. Received "abc".'
  );
});

test('normalizeConnectionPort throws a ConfigError for a port outside the valid range', () => {
  const knexClient = { client: { connectionSettings: { port: '70000' } } };
  expect(() => normalizeConnectionPort(knexClient)).toThrow(ConfigError);
});
