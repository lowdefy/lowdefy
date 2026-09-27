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

// A value the client can drop before it reads the object holding it: an
// undefined value is never sent, a "__proto__" key read from JSON becomes a
// prototype once the object is copied by assignment, and a value that can run
// as an operator can evaluate to undefined.
function canVanish({ key, value }) {
  return (
    key === '__proto__' ||
    type.isUndefined(value) ||
    // eslint-disable-next-line no-use-before-define
    getPossibleOperators(value).length > 0
  );
}

// The operators an object can run as on the client. The client treats an object
// as an operator once one key is left, so { _user: 'email', x: { _if: { test:
// false } } } runs _user. An operator-named key counts when every other key can
// vanish; beside a literal that stays, as in { _score: 0.5, title: 'x' }, it is
// data. ~ keys are markers the client hides, so they never count as keys.
function getPossibleOperators(value) {
  if (!type.isObject(value)) {
    return [];
  }
  const keys = Object.keys(value).filter((key) => !key.startsWith('~'));
  const staying = keys.filter((key) => !canVanish({ key, value: value[key] }));
  if (staying.length > 1) {
    return [];
  }
  return keys
    .filter((key) => staying.length === 0 || staying[0] === key)
    .map((key) => getOperatorType({ [key]: value[key] }))
    .filter((operator) => operator !== null);
}

export default getPossibleOperators;
