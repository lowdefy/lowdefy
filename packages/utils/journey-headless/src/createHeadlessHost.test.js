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

import createHeadlessHost from './createHeadlessHost.js';

const host = {
  call: () => undefined,
  close: () => undefined,
  dataSession: {},
  errorSink: { errors: [], add: () => undefined },
  loadClientPlugins: () => undefined,
  readPageConfig: () => undefined,
  resolveUser: () => null,
  rootConfig: {},
};

test('createHeadlessHost returns a host with every part', () => {
  expect(createHeadlessHost(host)).toBe(host);
});

test('createHeadlessHost names the parts a host is missing', () => {
  const { call, rootConfig, ...rest } = host;
  expect(() => createHeadlessHost(rest)).toThrow('The headless host is missing call, rootConfig.');
});

test('createHeadlessHost refuses a host that is not an object', () => {
  expect(() => createHeadlessHost(null)).toThrow('A headless host is an object. Received null.');
});
