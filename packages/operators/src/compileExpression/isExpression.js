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

import findExpressionEnd from './findExpressionEnd.js';

// The recognition rule (design §3): a scalar is an expression iff, after
// trimming, the "${" is the first thing in it and the "}" that closes it is
// the last. Anything else stays the literal string it was in v7 —
// "${HOME}/data", "${a} ${b}" and an unterminated "${ a" are all values, not
// expressions, so adding the syntax breaks no existing config. A scalar that
// passes this test is unambiguously an expression, so a body that fails to
// parse is a hard error rather than a literal (compileExpression).
function isExpression(value) {
  if (!type.isString(value)) return false;
  const trimmed = value.trim();
  const end = findExpressionEnd(trimmed);
  return end !== -1 && end === trimmed.length - 1;
}

export default isExpression;
