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

function isObject(value) {
  return value !== null && typeof value === 'object';
}

function childPath(parentPath, key, isArrayIndex) {
  if (isArrayIndex) {
    return `${parentPath}[${key}]`;
  }
  return parentPath === '' ? key : `${parentPath}.${key}`;
}

// The paths at which two parsed JSON values differ, depth first in key order,
// up to limit: [{ path, baseline, current }]. A key one side lacks is
// undefined on that side.
function diffJson({ baseline, current, limit = 20 }) {
  const differences = [];

  function walk(left, right, currentPath) {
    if (differences.length >= limit) return;
    if (Array.isArray(left) && Array.isArray(right)) {
      const length = Math.max(left.length, right.length);
      for (let index = 0; index < length; index++) {
        walk(left[index], right[index], childPath(currentPath, String(index), true));
        if (differences.length >= limit) return;
      }
      return;
    }
    if (isObject(left) && isObject(right) && !Array.isArray(left) && !Array.isArray(right)) {
      const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])];
      for (const key of keys) {
        const leftHas = Object.hasOwn(left, key);
        const rightHas = Object.hasOwn(right, key);
        if (leftHas !== rightHas) {
          differences.push({
            path: childPath(currentPath, key, false),
            baseline: left[key],
            current: right[key],
          });
        } else {
          walk(left[key], right[key], childPath(currentPath, key, false));
        }
        if (differences.length >= limit) return;
      }
      return;
    }
    if (left !== right) {
      differences.push({ path: currentPath, baseline: left, current: right });
    }
  }

  walk(baseline, current, '');
  return differences;
}

export default diffJson;
