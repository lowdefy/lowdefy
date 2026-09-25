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

// Operators whose result is built only from their params, which the reviver
// has already evaluated and checked, or from a _function body, whose nested
// parse checks its own operators. Every other operator's result is scanned
// under literalData, including plugin operators. The set is closed: a missing
// entry rejects valid content, it never lets data through.
const PASS_THROUGH = new Set([
  '_args',
  '_array',
  '_function',
  '_get',
  '_if',
  '_if_none',
  '_log',
  '_switch',
]);

// _object builds keys from data strings in these methods.
const OBJECT_CONSTRUCTORS = new Set(['defineProperty', 'fromEntries']);

function isLiteralPassThrough({ op, methodName }) {
  if (op === '_object') {
    return !OBJECT_CONSTRUCTORS.has(methodName);
  }
  return PASS_THROUGH.has(op);
}

export default isLiteralPassThrough;
