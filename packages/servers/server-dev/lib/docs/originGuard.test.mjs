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

import { expect, test } from 'vitest';

import originGuard from './originGuard.js';

test('originGuard is the origin host and port, so http and https on one port share it', () => {
  expect(originGuard({ origin: 'http://localhost:3001' })).toEqual('localhost:3001');
  expect(originGuard({ origin: 'https://localhost:3001' })).toEqual('localhost:3001');
});

test('originGuard tells apart default ports and hosts', () => {
  expect(originGuard({ origin: 'http://localhost' })).toEqual('localhost:80');
  expect(originGuard({ origin: 'https://localhost' })).toEqual('localhost:443');
  expect(originGuard({ origin: 'http://127.0.0.1:3001' })).toEqual('127.0.0.1:3001');
  expect(originGuard({ origin: 'http://[::1]:3001' })).toEqual('[::1]:3001');
});
