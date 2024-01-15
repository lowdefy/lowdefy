/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { serializer, type } from '@lowdefy/helpers';

// eslint-disable-next-line consistent-return
const getIndex = (value, options, key = 'value') => {
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < options.length; i++) {
    if (type.isPrimitive(options[i]) && options[i] === value) {
      return `${i}`;
    }
    if (
      type.isObject(options[i]) &&
      serializer.serializeToString(options[i][key], { stable: true }) ===
        serializer.serializeToString(value, { stable: true })
    ) {
      return `${i}`;
    }
  }
};
const getValueIndex = (value, options, multiple, key) => {
  if (!multiple) {
    return getIndex(value, options, key);
  }
  const index = [];
  value.forEach((val) => {
    index.push(getIndex(val, options, key));
  });
  return index;
};

export default getValueIndex;
