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

// Types whose empty value is only null/undefined: a required number is
// satisfied by 0, a required boolean by false, a required object by {}.
const NONE_ONLY_TYPES = new Set(['number', 'integer', 'boolean', 'object']);

function firstConcreteType(declaredType) {
  if (type.isString(declaredType)) return declaredType;
  if (type.isArray(declaredType)) {
    return declaredType.find((entry) => entry !== 'null');
  }
  return undefined;
}

// The `pass` test validateEval appends for a required block. Without a declared
// type the block is empty when its value is null, undefined, '' or []. A type
// declared in the page state contract decides instead: string keeps '' empty,
// array keeps [] empty, and the rest are empty only when null or undefined.
function getRequiredValidation({ declaredType, message }) {
  const concreteType = firstConcreteType(declaredType);
  const emptyType = NONE_ONLY_TYPES.has(concreteType) ? 'none' : 'empty';
  return {
    pass: { _not: { _type: emptyType } },
    status: 'error',
    message,
  };
}

export default getRequiredValidation;
