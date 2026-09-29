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

import getGroupOperator from './getGroupOperator.js';

function collect(condition, keys) {
  const operator = getGroupOperator(condition);
  if (operator === null) {
    if (type.isObject(condition) && !type.isNone(condition.key)) keys.add(condition.key);
    return;
  }
  (type.isArray(condition[operator]) ? condition[operator] : []).forEach((child) =>
    collect(child, keys)
  );
}

// Every column key a condition's leaves reference.
function getConditionKeys(condition) {
  const keys = new Set();
  collect(condition, keys);
  return keys;
}

export default getConditionKeys;
