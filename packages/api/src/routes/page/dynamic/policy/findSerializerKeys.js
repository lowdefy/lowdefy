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

// Paths of the "~" keys in serialized content. The client revives each such
// wrapper ("~e" to an Error, "~d" to a Date, "~arr" to an array) only after it
// has evaluated the operators inside it, where the policy walk does not look.
// Block config never needs one, so every "~" key is reported, except the
// { "~d": <number> } of a date, which holds no config.
function findSerializerKeys({ value, path, paths = [] }) {
  if (type.isArray(value)) {
    value.forEach((item, index) =>
      findSerializerKeys({ value: item, path: `${path}.${index}`, paths })
    );
    return paths;
  }
  if (!type.isObject(value)) {
    return paths;
  }
  const keys = Object.keys(value);
  if (keys.length === 1 && keys[0] === '~d' && type.isNumber(value['~d'])) {
    return paths;
  }
  keys.forEach((key) => {
    if (key.startsWith('~')) {
      paths.push(`${path}.${key}`);
      return;
    }
    findSerializerKeys({ value: value[key], path: `${path}.${key}`, paths });
  });
  return paths;
}

export default findSerializerKeys;
