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

import fs from 'node:fs';

import authEngineActions from './authEngineActions.js';
import authEngineMethods from './authEngineMethods.js';
import { expect, test } from 'vitest';

test('authEngineMethods maps client auth methods to exactly the authEngineActions types', () => {
  expect(new Set(Object.values(authEngineMethods))).toEqual(authEngineActions);
  expect(Object.values(authEngineMethods)).toHaveLength(authEngineActions.size);
});

test('every method of authEngineMethods is a method the client creates', () => {
  const source = fs.readFileSync(
    new URL('../../../../../client/src/auth/createAuthMethods.js', import.meta.url),
    'utf8'
  );
  const exported = source.slice(source.lastIndexOf('  return {'));
  Object.keys(authEngineMethods).forEach((method) => {
    expect(exported).toMatch(new RegExp(`^    ${method},?$`, 'm'));
  });
});
