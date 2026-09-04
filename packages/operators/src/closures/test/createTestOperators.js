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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// The parity harness must not depend on an operator plugin package (@lowdefy/operators
// has no plugin dependency), so the corpus runs against deterministic stand-ins
// named after the operators the corpus actually uses. Both engines call the same
// function, so any deterministic body proves the surrounding contract; the bodies
// below cover the four behaviours the contract distinguishes: a value, a thrown
// Error, a thrown ConfigError, and re-entering the parser.
function stringify(params) {
  if (type.isUndefined(params)) return 'undefined';
  return JSON.stringify(params) ?? 'undefined';
}

function createTestOperators({ names, throwing = [], configErrors = [], reentrant = [] }) {
  const operators = {};
  names.forEach((name) => {
    if (throwing.includes(name)) {
      operators[name] = () => {
        throw new Error(`${name} failed.`);
      };
      return;
    }
    if (configErrors.includes(name)) {
      operators[name] = ({ params }) => {
        throw new ConfigError(`${name} is misconfigured.`, { received: params });
      };
      return;
    }
    if (reentrant.includes(name)) {
      operators[name] = ({ location, params, parser }) => {
        const { output } = parser.parse({ input: params, location });
        return { [name]: output };
      };
      return;
    }
    operators[name] = ({ methodName, params }) => {
      if (type.isArray(params)) return params.length;
      if (type.isObject(params)) return Object.keys(params).sort().join('|');
      return `${name}${methodName ? `.${methodName}` : ''}(${stringify(params)})`;
    };
  });
  return operators;
}

export default createTestOperators;
