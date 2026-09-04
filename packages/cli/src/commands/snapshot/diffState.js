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

import { type } from '@lowdefy/helpers';

import applyIgnore from './applyIgnore.js';

function collectDifferences({ expected, actual, path, differences }) {
  if (type.isArray(expected) && type.isArray(actual)) {
    const length = Math.max(expected.length, actual.length);
    for (let index = 0; index < length; index += 1) {
      collectDifferences({
        expected: expected[index],
        actual: actual[index],
        path: path === '' ? String(index) : `${path}.${index}`,
        differences,
      });
    }
    return;
  }
  if (type.isObject(expected) && type.isObject(actual)) {
    const keys = [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort();
    keys.forEach((key) => {
      collectDifferences({
        expected: expected[key],
        actual: actual[key],
        path: path === '' ? key : `${path}.${key}`,
        differences,
      });
    });
    return;
  }
  // Both sides are JSON (state.json on disk, a JSON round-trip in the page), so
  // stringify is an exact structural comparison for the scalars left here.
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    differences.push({ path: path === '' ? '<root>' : path, expected, actual });
  }
}

// diffState deep-compares a golden state.json with a freshly captured state
// after removing the ignored paths from both, and reports each differing path
// with the two values. Neither input is mutated.
function diffState({ expected, actual, snapshotIgnore = [] }) {
  const expectedCopy = applyIgnore({ state: expected, ignore: snapshotIgnore });
  const actualCopy = applyIgnore({ state: actual, ignore: snapshotIgnore });
  const differences = [];
  collectDifferences({ expected: expectedCopy, actual: actualCopy, path: '', differences });
  return { changed: differences.length > 0, differences };
}

export default diffState;
