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

function createWindow({ stored = {}, throws = false } = {}) {
  return {
    sessionStorage: {
      getItem: (key) => {
        if (throws) throw new Error('storage disabled');
        return stored[key] ?? null;
      },
      setItem: (key, value) => {
        if (throws) throw new Error('storage disabled');
        stored[key] = value;
      },
    },
  };
}

test('shouldReloadForBuild is false when the server build matches the bundle', () => {
  const window = createWindow();
  expect(shouldReloadForBuild({ bundleBuildId: 'build-1', serverBuildId: 'build-1', window })).toBe(
    false
  );
});

test('shouldReloadForBuild is false when the server sends no build id', () => {
  const window = createWindow();
  expect(shouldReloadForBuild({ bundleBuildId: 'build-1', serverBuildId: undefined, window })).toBe(
    false
  );
  expect(shouldReloadForBuild({ bundleBuildId: 'build-1', serverBuildId: null, window })).toBe(
    false
  );
});

test('shouldReloadForBuild is true once per newer server build, then false', () => {
  const stored = {};
  const window = createWindow({ stored });
  expect(shouldReloadForBuild({ bundleBuildId: 'build-1', serverBuildId: 'build-2', window })).toBe(
    true
  );
  expect(stored['lowdefy.reloadedForBuild']).toEqual('build-2');
  expect(shouldReloadForBuild({ bundleBuildId: 'build-1', serverBuildId: 'build-2', window })).toBe(
    false
  );
});

test('shouldReloadForBuild reloads again when the server moves to a third build', () => {
  const window = createWindow({ stored: { 'lowdefy.reloadedForBuild': 'build-2' } });
  expect(shouldReloadForBuild({ bundleBuildId: 'build-2', serverBuildId: 'build-3', window })).toBe(
    true
  );
});

test('shouldReloadForBuild is false when sessionStorage is unavailable', () => {
  const window = createWindow({ throws: true });
  expect(shouldReloadForBuild({ bundleBuildId: 'build-1', serverBuildId: 'build-2', window })).toBe(
    false
  );
});
