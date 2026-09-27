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

// The operators an object can run as on the client. The client treats an object
// as an operator once one key is left: a key whose value is undefined is never
// sent, and a key whose operator evaluates to undefined is dropped before its
// parent is read. So { _user: 'email', x: { _if: { test: false } } } runs _user,
// and every operator-named key counts, not only a single-key object's.
function getPossibleOperators(value) {
  if (!type.isObject(value)) {
    return [];
  }
  return Object.keys(value)
    .map((key) => getOperatorType({ [key]: value[key] }))
    .filter((operator) => operator !== null);
}

export default getPossibleOperators;
