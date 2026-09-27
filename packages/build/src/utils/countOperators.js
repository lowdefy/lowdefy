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
import { ConfigError } from '@lowdefy/errors';

const OPERATOR_NAME = /^_[A-Za-z]\w*$/;

function getOperatorParams(value) {
  const [operatorKey] = Object.keys(value).filter((key) => !key.startsWith('~'));
  return value[operatorKey];
}

// The names an _operator `name` can evaluate to, when config fixes them: a
// literal, or the literal branches an _if or _switch returns (anything an _if
// only compares in its `test` is not a name the call can take). A missing
// branch or a value that is not a string names nothing; the operator refuses
// it at runtime. null when a name is read at runtime (state, a request, a
// payload).
function getLiteralNames(name) {
  if (type.isString(name)) {
    return [name];
  }
  const operator = getOperatorType(name);
  if (operator === null) {
    return [];
  }
  let branches = null;
  if (operator === '_if') {
    const params = getOperatorParams(name);
    branches = [params?.then, params?.else];
  }
  if (operator === '_switch') {
    const params = getOperatorParams(name);
    branches = [
      ...(type.isArray(params?.branches) ? params.branches : []).map((branch) => branch?.then),
      params?.default,
    ];
  }
  if (branches === null) {
    return null;
  }
  const names = branches.map(getLiteralNames);
  if (names.some((branchNames) => branchNames === null)) {
    return null;
  }
  return names.flat();
}

function countName(name, counter, configKey) {
  if (!type.isString(name)) {
    return;
  }
  const [operator] = name.split('.');
  if (OPERATOR_NAME.test(operator)) {
    counter.increment(operator, configKey);
  }
}

// _operator calls the operator it names through the operator registry, so the
// names it can take are counted like operators the config uses directly: the
// names config fixes, and the operators listed in `operators`. A name read at
// runtime must come with that list. The build then bundles exactly those, on
// the page and on the server, and the operator refuses any name not listed.
function countNamedOperators(value, counter, configKey) {
  const params = getOperatorParams(value);
  const names =
    type.isObject(params) && getOperatorType(params) === null ? getLiteralNames(params.name) : null;
  const listed = type.isObject(params) ? params.operators : undefined;
  if (type.isNone(listed)) {
    if (names === null) {
      throw new ConfigError(
        '_operator "name" is read at runtime, so the build cannot tell which operator it calls. List the operators it may call in "operators", for example operators: [_sum, _product].',
        { configKey }
      );
    }
    names.forEach((name) => countName(name, counter, configKey));
    return;
  }
  if (
    !type.isArray(listed) ||
    !listed.every((name) => type.isString(name) && OPERATOR_NAME.test(name.split('.')[0]))
  ) {
    throw new ConfigError('_operator "operators" must be a list of operator names.', {
      received: listed,
      configKey,
    });
  }
  if (listed.some((name) => name.split('.')[0] === '_operator')) {
    throw new ConfigError('_operator "operators" cannot list "_operator".', { configKey });
  }
  [...(names ?? []), ...listed].forEach((name) => countName(name, counter, configKey));
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
    countNamedOperators(value, counter, configKey);
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
