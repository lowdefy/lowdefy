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
import isCompleteLeaf from './isCompleteLeaf.js';

// The part of a view filter that constrains rows: incomplete leaves and the groups they leave
// empty are dropped, so a filter that is being built shows every row until it says something.
// Malformed groups pass through unchanged, for compileCondition to report.
function pruneCondition(condition) {
  if (!type.isObject(condition)) return null;
  const operator = getGroupOperator(condition);
  if (operator === null) {
    return isCompleteLeaf(condition) ? condition : null;
  }
  const list = condition[operator];
  if (!type.isArray(list)) return condition;
  const children = list.map(pruneCondition).filter((child) => child !== null);
  if (children.length === 0) return null;
  return { [operator]: children };
}

export default pruneCondition;
