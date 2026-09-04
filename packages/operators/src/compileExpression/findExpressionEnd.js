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

// Returns the index of the "}" that closes the leading "${" of a trimmed
// scalar, or -1 when there is none. Braces nest and quoted strings are opaque,
// so a "}" inside a literal (${ a == '}' }) does not close early. This is the
// single implementation of the design's start-and-end rule (§3): both the
// recognition test (isExpression) and the compiler (compileExpression) read it,
// so a scalar can never be recognised as an expression the compiler then
// refuses to delimit.
function findExpressionEnd(trimmed) {
  if (!trimmed.startsWith('${')) return -1;
  let depth = 0;
  let quote = null;
  for (let i = 1; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (quote) {
      if (ch === '\\') i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export default findExpressionEnd;
