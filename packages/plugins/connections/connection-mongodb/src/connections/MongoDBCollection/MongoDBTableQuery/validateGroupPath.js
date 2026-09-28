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

function isGroupValue(value) {
  return (
    type.isNull(value) ||
    type.isString(value) ||
    type.isNumber(value) ||
    type.isBoolean(value) ||
    type.isDate(value) ||
    value instanceof ObjectId
  );
}

// groupPath holds the group keys this server returned for the levels above, so each is a
// scalar; anything else (an object such as { $ne: null }) is refused.
function validateGroupPath({ groupPath, group }) {
  if (type.isNone(groupPath)) {
    return [];
  }
  if (!type.isArray(groupPath) || groupPath.length > group.length) {
    throw new Error(
      `MongoDBTableQuery groupPath must be an array no longer than view group (${
        group.length
      }). Received ${JSON.stringify(groupPath)}.`
    );
  }
  groupPath.forEach((value, index) => {
    if (!isGroupValue(value)) {
      throw new Error(
        `MongoDBTableQuery groupPath value for "${
          group[index].key
        }" must be a string, number, boolean, date or null. Received ${JSON.stringify(value)}.`
      );
    }
  });
  return groupPath;
}

export default validateGroupPath;
