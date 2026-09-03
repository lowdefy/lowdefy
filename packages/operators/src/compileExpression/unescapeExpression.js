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

// The literal-`${` escape (design §7): a scalar whose trimmed value starts with
// "$${" is not an expression — the leading "$$" collapses to "$", so
// "$${ foo }" yields the literal string "${ foo }". Only the leading position
// (the one that would otherwise trigger compilation) is an escape; "$$"
// anywhere else in the string is untouched. Values that are not strings, or
// strings with no leading escape, pass through unchanged.
function unescapeExpression(value) {
  if (!type.isString(value)) return value;
  // This runs on every scalar of every YAML file in every build, so the
  // common case exits on a single char code: only "$" (36) or leading
  // whitespace can precede the escape, and trimStart() allocates a copy.
  const first = value.charCodeAt(0);
  if (first !== 36 && first !== 32 && first !== 9 && first !== 10 && first !== 13) return value;
  if (!value.trimStart().startsWith('$${')) return value;
  const index = value.indexOf('$${');
  return value.slice(0, index) + value.slice(index + 1);
}

export default unescapeExpression;
