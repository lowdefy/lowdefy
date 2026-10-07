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

import isSameVersion from './isSameVersion.js';

test('isSameVersion is true for the same release written two ways', () => {
  expect(isSameVersion({ a: '7.1.0', b: 'v7.1.0' })).toBe(true);
  expect(isSameVersion({ a: '7.1.0', b: '7.1.0+build.5' })).toBe(true);
});

test('isSameVersion is false for different releases and prereleases', () => {
  expect(isSameVersion({ a: '7.1.0', b: '7.2.0' })).toBe(false);
  expect(
    isSameVersion({
      a: '0.0.0-experimental-20261002122353',
      b: '0.0.0-experimental-20261006090000',
    })
  ).toBe(false);
});

test('isSameVersion compares a version that is not semver as written', () => {
  expect(isSameVersion({ a: 'local', b: 'local' })).toBe(true);
  expect(isSameVersion({ a: 'local', b: '7.1.0' })).toBe(false);
});

test('isSameVersion is false when a version is missing', () => {
  expect(isSameVersion({ a: '7.1.0', b: undefined })).toBe(false);
});
