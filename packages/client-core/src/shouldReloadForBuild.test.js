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

import shouldReloadForBuild from './shouldReloadForBuild.js';
import createMemoryStore from './test/createMemoryStore.js';

test('shouldReloadForBuild is false when the server build matches the bundle', () => {
  const sessionStorage = createMemoryStore();
  expect(
    shouldReloadForBuild({ bundleBuildId: 'build-1', serverBuildId: 'build-1', sessionStorage })
  ).toBe(false);
});

test('shouldReloadForBuild is false when the server sends no build id', () => {
  const sessionStorage = createMemoryStore();
  expect(
    shouldReloadForBuild({ bundleBuildId: 'build-1', serverBuildId: undefined, sessionStorage })
  ).toBe(false);
  expect(
    shouldReloadForBuild({ bundleBuildId: 'build-1', serverBuildId: null, sessionStorage })
  ).toBe(false);
});

test('shouldReloadForBuild is true once per newer server build, then false', () => {
  const stored = {};
  const sessionStorage = createMemoryStore({ stored });
  expect(
    shouldReloadForBuild({ bundleBuildId: 'build-1', serverBuildId: 'build-2', sessionStorage })
  ).toBe(true);
  expect(stored['lowdefy.reloadedForBuild']).toEqual('build-2');
  expect(
    shouldReloadForBuild({ bundleBuildId: 'build-1', serverBuildId: 'build-2', sessionStorage })
  ).toBe(false);
});

test('shouldReloadForBuild reloads again when the server moves to a third build', () => {
  const sessionStorage = createMemoryStore({ stored: { 'lowdefy.reloadedForBuild': 'build-2' } });
  expect(
    shouldReloadForBuild({ bundleBuildId: 'build-2', serverBuildId: 'build-3', sessionStorage })
  ).toBe(true);
});

test('shouldReloadForBuild is false when sessionStorage is unavailable', () => {
  const sessionStorage = createMemoryStore({ throws: true });
  expect(
    shouldReloadForBuild({ bundleBuildId: 'build-1', serverBuildId: 'build-2', sessionStorage })
  ).toBe(false);
});
