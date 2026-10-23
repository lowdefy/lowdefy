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

import createDefaultLeaf from './createDefaultLeaf.js';
import getGroupOperator from './getGroupOperator.js';
import toRootGroup from './toRootGroup.js';

// The filter with a new, empty condition on `column` at the end of its top group, as the
// builder's Add condition makes one. It filters nothing until it has a value.
function addColumnLeaf({ condition, column }) {
  const root = toRootGroup(condition);
  const operator = getGroupOperator(root);
  return { [operator]: [...root[operator], createDefaultLeaf({ column })] };
}

export default addColumnLeaf;
