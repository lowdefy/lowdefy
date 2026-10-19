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

import compileLeaf from './compileLeaf.js';

// Compiles a validated Condition to a $match expression, or null when it constrains
// nothing (an empty group, as the filter builder produces before a rule is added).
function compileCondition({ condition, fieldsByKey, now, timeZone }) {
  const groupOp = ['and', 'or'].find((op) => Object.prototype.hasOwnProperty.call(condition, op));
  if (groupOp === undefined) {
    return compileLeaf({ condition, field: fieldsByKey.get(condition.key), now, timeZone });
  }
  const children = condition[groupOp]
    .map((child) => compileCondition({ condition: child, fieldsByKey, now, timeZone }))
    .filter((child) => child !== null);
  if (children.length === 0) {
    return null;
  }
  if (children.length === 1) {
    return children[0];
  }
  return { [`$${groupOp}`]: children };
}

export default compileCondition;
