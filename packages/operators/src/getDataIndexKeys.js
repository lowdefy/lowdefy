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

import getKeyOperator from './getKeyOperator.js';

// The keys an object is remembered under when it is data: its block or action
// type, and each client operator one of its keys names. An object with none of
// these cannot become a block, an action or an operator, so it is not tracked.
function getDataIndexKeys({ value, operators }) {
  const indexKeys = [];
  if (type.isString(value.type)) {
    indexKeys.push(`type:${value.type}`);
  }
  Object.keys(value).forEach((key) => {
    const operator = getKeyOperator({ key, operators });
    if (operator !== null) {
      indexKeys.push(`operator:${operator}`);
    }
  });
  return indexKeys;
}

export default getDataIndexKeys;
