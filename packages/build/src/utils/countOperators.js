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

import { type } from '@lowdefy/helpers';

function walkAndCount(value, counter, parentConfigKey) {
  if (type.isArray(value)) {
    value.forEach((item) => walkAndCount(item, counter, parentConfigKey));
    return;
  }

  if (!type.isObject(value)) {
    return;
  }

  const configKey = value['~k'] || parentConfigKey;
  const keys = Object.keys(value);

  // Check if this object is an operator (single key starting with _)
  if (keys.length === 1) {
    const key = keys[0];
    const [op] = key.split('.');
    const operator = op.replace(/^(_+)/gm, '_');
    if (operator.length > 1 && operator[0] === '_') {
      counter.increment(operator, configKey);
    }
  }

  // Recurse into all values
  keys.forEach((key) => {
    walkAndCount(value[key], counter, configKey);
  });
}

function countOperators(obj, { counter }) {
  walkAndCount(obj, counter, null);
}

export default countOperators;
