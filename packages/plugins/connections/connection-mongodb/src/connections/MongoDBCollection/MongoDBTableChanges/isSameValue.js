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

import { ObjectId } from 'mongodb';
import { type } from '@lowdefy/helpers';

// Deep equality of config values, with ObjectIds and dates compared by value.
function isSameValue(first, second) {
  if (first instanceof ObjectId || second instanceof ObjectId) {
    return first instanceof ObjectId && second instanceof ObjectId && first.equals(second);
  }
  if (type.isDate(first) || type.isDate(second)) {
    return type.isDate(first) && type.isDate(second) && first.getTime() === second.getTime();
  }
  if (type.isArray(first) || type.isArray(second)) {
    return (
      type.isArray(first) &&
      type.isArray(second) &&
      first.length === second.length &&
      first.every((item, index) => isSameValue(item, second[index]))
    );
  }
  if (type.isObject(first) || type.isObject(second)) {
    if (!type.isObject(first) || !type.isObject(second)) return false;
    const keys = Object.keys(first);
    return (
      keys.length === Object.keys(second).length &&
      keys.every((key) => Object.hasOwn(second, key) && isSameValue(first[key], second[key]))
    );
  }
  return first === second;
}

export default isSameValue;
