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

import { getOperatorType } from '@lowdefy/helpers';

// The client operator an object key names ('_state' for "__state" or
// "_state.key"), or null. The client runs only operators it has, so a key such
// as "_score" that names no client operator is data. With no operator set (no
// app to ask) every operator-shaped key counts.
function getKeyOperator({ key, operators = null }) {
  // A "__proto__" key read from JSON becomes a prototype once the object is
  // copied by assignment, so it never reaches the client as a key.
  if (key === '__proto__') {
    return null;
  }
  const operator = getOperatorType({ [key]: true });
  if (operator === null) {
    return null;
  }
  if (operators !== null && !operators.has(operator)) {
    return null;
  }
  return operator;
}

export default getKeyOperator;
