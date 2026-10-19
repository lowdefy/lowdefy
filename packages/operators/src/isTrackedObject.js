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

// An object the literal data rules track: one that could become a block or an
// action (it has a string type) or run as a client operator (a key names one).
// An object with neither cannot become structure, so it is not tracked.
function isTrackedObject({ value, operators }) {
  if (!type.isObject(value)) {
    return false;
  }
  if (type.isString(value.type)) {
    return true;
  }
  return Object.keys(value).some((key) => getKeyOperator({ key, operators }) !== null);
}

export default isTrackedObject;
