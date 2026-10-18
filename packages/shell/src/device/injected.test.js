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

import injected, { installInjector } from './injected.js';

test('with no injector installed, as in a release shell, nothing is injected', () => {
  expect(injected('scan')).toBeUndefined();
  expect(injected('permission:camera')).toBeUndefined();
});

test('injected reads the installed injector until it is removed', () => {
  const take = (name) => `next ${name}`;
  const remove = installInjector({ take });
  expect(injected('scan')).toBe('next scan');
  remove();
  expect(injected('scan')).toBeUndefined();
});

test('removing an injector that was replaced leaves the newer one installed', () => {
  const removeFirst = installInjector({ take: () => 'first' });
  const removeSecond = installInjector({ take: () => 'second' });
  removeFirst();
  expect(injected('scan')).toBe('second');
  removeSecond();
  expect(injected('scan')).toBeUndefined();
});
