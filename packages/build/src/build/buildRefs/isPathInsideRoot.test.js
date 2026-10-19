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

import path from 'path';

import isPathInsideRoot from './isPathInsideRoot.js';

const root = path.resolve('/modules/app');

test('isPathInsideRoot returns true for the root itself', () => {
  expect(isPathInsideRoot({ root, target: root })).toBe(true);
});

test('isPathInsideRoot returns true for a file below the root', () => {
  expect(isPathInsideRoot({ root, target: path.join(root, 'pages', 'home.yaml') })).toBe(true);
});

test('isPathInsideRoot returns true for a file whose name starts with two dots', () => {
  expect(isPathInsideRoot({ root, target: path.join(root, '..hidden.yaml') })).toBe(true);
});

test('isPathInsideRoot returns false for the parent of the root', () => {
  expect(isPathInsideRoot({ root, target: path.dirname(root) })).toBe(false);
});

test('isPathInsideRoot returns false for a sibling directory sharing the root as a prefix', () => {
  expect(isPathInsideRoot({ root, target: `${root}-other${path.sep}page.yaml` })).toBe(false);
});

test('isPathInsideRoot returns false when parent segments climb out of the root', () => {
  expect(isPathInsideRoot({ root, target: `${root}${path.sep}..${path.sep}escape.yaml` })).toBe(
    false
  );
});

test('isPathInsideRoot returns false for an unrelated absolute path', () => {
  expect(isPathInsideRoot({ root, target: path.resolve('/elsewhere/evil.js') })).toBe(false);
});
