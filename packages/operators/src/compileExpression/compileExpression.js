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

import ExpressionError from './ExpressionError.js';
import emit from './emit.js';
import parse from './parse.js';
import tokenize from './tokenize.js';

// Validates that a trimmed scalar is a single, well-formed ${ … } and returns
// the inner body. Throws ExpressionError for an unterminated expression or for
// interpolation (a "}" that closes before the end — "${a} ${b}" is not a single
// expression). Quoted strings are opaque so a "}" inside a literal does not
// close early.
function stripDelimiters(trimmed) {
  if (!trimmed.startsWith('${')) {
    throw new ExpressionError('expression must be wrapped in ${ … }');
  }
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
      if (depth === 0) {
        if (i !== trimmed.length - 1) {
          throw new ExpressionError(
            'a scalar may hold a single ${ … } expression; interpolation such as ' +
              '"${a} ${b}" or "text ${x}" is not supported — use _nunjucks or _string.format',
            { column: i + 1 }
          );
        }
        return trimmed.slice(2, -1);
      }
    }
  }
  throw new ExpressionError('unterminated expression, expected a closing "}"');
}

// Compiles a single ${ … } expression scalar to an operator tree. `expression`
// is the full scalar including delimiters. Location is optional (the build
// layer supplies filePath/lineNumber/columnNumber so a parse error resolves to
// source); without it the ConfigError still carries a useful message. Success
// returns the bare operator tree — source positions are stamped separately by
// stampPosition so this function stays pure and unit-testable.
function compileExpression({ expression, filePath, lineNumber, columnNumber } = {}) {
  try {
    const body = stripDelimiters(expression.trim());
    const tokens = tokenize(body);
    const ast = parse(tokens);
    return emit(ast);
  } catch (error) {
    if (!(error instanceof ExpressionError)) throw error;
    let message = `Expression error: ${error.message}`;
    if (error.column != null) {
      message += ` (at column ${error.column} of the expression)`;
    }
    message += ` in ${expression.trim()}.`;
    // The file:line:column is carried structurally so the build logger renders
    // it as the error's location (it is not duplicated into the message).
    throw new ConfigError(message, {
      filePath: filePath ?? null,
      lineNumber: lineNumber ?? null,
      columnNumber: columnNumber ?? null,
      checkSlug: 'expression',
      received: expression,
    });
  }
}

export default compileExpression;
