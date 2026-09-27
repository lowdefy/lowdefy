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

import { getOperatorType, type } from '@lowdefy/helpers';

const OPERATOR_NAME = /^_[A-Za-z]\w*$/;

// _operator calls the operator it names through the operator registry, so the
// names written in its `name` config (a literal, or the names an _if returns
// from `then` and `else`) are counted like operators the config uses directly.
// A name read from state or a request, and anything an _if only compares in its
// `test`, is not a name the call can take.
function countNamedOperators(name, counter, configKey) {
  if (type.isString(name)) {
    const [operator] = name.split('.');
    if (OPERATOR_NAME.test(operator)) {
      counter.increment(operator, configKey);
    }
    return;
  }
  if (getOperatorType(name) !== '_if') {
    return;
  }
  const [ifKey] = Object.keys(name).filter((key) => !key.startsWith('~'));
  countNamedOperators(name[ifKey]?.then, counter, configKey);
  countNamedOperators(name[ifKey]?.else, counter, configKey);
}

function walkAndCount(value, counter, parentConfigKey) {
  if (type.isArray(value)) {
    value.forEach((item) => walkAndCount(item, counter, parentConfigKey));
    return;
  }

  if (!type.isObject(value)) {
    return;
  }

  const configKey = value['~k'] || parentConfigKey;

  const operator = getOperatorType(value);
  if (operator) {
    counter.increment(operator, configKey);
  }
  if (operator === '_operator') {
    const [operatorKey] = Object.keys(value).filter((key) => !key.startsWith('~'));
    countNamedOperators(value[operatorKey]?.name, counter, configKey);
  }

  // Recurse into all values
  Object.keys(value).forEach((key) => {
    walkAndCount(value[key], counter, configKey);
  });
}

function countOperators(obj, { counter }) {
  walkAndCount(obj, counter, null);
}

export default countOperators;
