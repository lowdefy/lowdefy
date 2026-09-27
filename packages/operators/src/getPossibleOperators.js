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

// A value the client can drop before it reads the object holding it: an
// undefined value or a function is never sent, a "__proto__" key read from JSON
// becomes a prototype once the object is copied by assignment, and a value that
// can run as an operator can evaluate to undefined.
function canVanish({ key, value, operators }) {
  return (
    key === '__proto__' ||
    type.isUndefined(value) ||
    type.isFunction(value) ||
    // eslint-disable-next-line no-use-before-define
    getPossibleOperators({ value, operators }).length > 0
  );
}

// The operators an object can run as on the client, as { key, operator } pairs.
// The client treats an object as an operator once one key is left, so
// { _user: 'email', x: { _if: { test: false } } } runs _user. An operator-named
// key counts when every other key can vanish; beside a literal that stays, as in
// { _user: 'email', title: 'x' }, it is data. ~ keys are markers the client
// hides, so they never count as keys. Every Dynamic content check decides what
// the client would run with this one rule.
function getPossibleOperators({ value, operators = null }) {
  if (!type.isObject(value)) {
    return [];
  }
  const keys = Object.keys(value).filter((key) => !key.startsWith('~'));
  const operatorKeys = keys
    .map((key) => ({ key, operator: getKeyOperator({ key, operators }) }))
    .filter(({ operator }) => operator !== null);
  // Most objects name no operator; they need no vanishing check below them.
  if (operatorKeys.length === 0) {
    return [];
  }
  const staying = keys.filter((key) => !canVanish({ key, value: value[key], operators }));
  if (staying.length > 1) {
    return [];
  }
  return operatorKeys.filter(({ key }) => staying.length === 0 || staying[0] === key);
}

export default getPossibleOperators;
