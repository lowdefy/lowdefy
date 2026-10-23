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
import validateShellPluginsListed from './validateShellPluginsListed.js';

function makeContext(plugins) {
  return { typesMapMobile: { plugins } };
}

test('validateShellPluginsListed accepts shell plugins the server read', () => {
  const mobile = {
    shells: [
      { id: 'field', plugins: [{ name: '@example/lowdefy-printer', version: '2.1.0' }] },
      { id: 'staging', plugins: [{ name: '@example/lowdefy-printer', version: '2.1.0' }] },
    ],
  };
  expect(() =>
    validateShellPluginsListed({ mobile, context: makeContext(['@example/lowdefy-printer']) })
  ).not.toThrow();
});

test('validateShellPluginsListed accepts shells without plugins', () => {
  const mobile = { shells: [{ id: 'field', profile: 'field' }] };
  expect(() => validateShellPluginsListed({ mobile, context: makeContext([]) })).not.toThrow();
  expect(() => validateShellPluginsListed({ mobile: {}, context: makeContext([]) })).not.toThrow();
});

test('validateShellPluginsListed throws for a shell plugin the server did not read', () => {
  const plugin = { name: '@example/lowdefy-mdm', version: '1.0.3' };
  Object.defineProperty(plugin, '~k', { value: 'k_12', enumerable: false });
  const mobile = { shells: [{ id: 'field', plugins: [plugin] }] };
  let error;
  try {
    validateShellPluginsListed({ mobile, context: makeContext([]) });
  } catch (e) {
    error = e;
  }
  expect(error.message).toBe(
    'Shell "field" lists plugin "@example/lowdefy-mdm", which the server did not install. List shell plugins in lowdefy.yaml itself, not under _ref, as root plugins are.'
  );
  expect(error.configKey).toBe('k_12');
});
