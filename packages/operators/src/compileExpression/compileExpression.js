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
import findExpressionEnd from './findExpressionEnd.js';
import parse from './parse.js';
import tokenize from './tokenize.js';

// Validates that a trimmed scalar is a single, well-formed ${ … } and returns
// the inner body. isExpression uses the same findExpressionEnd rule, so a
// scalar the build recognised always passes here; the throws cover direct
// callers of compileExpression with a scalar that was never an expression.
function stripDelimiters(trimmed) {
  const end = findExpressionEnd(trimmed);
  if (end === -1) {
    throw new ExpressionError('expression must be a single, closed ${ … }');
  }
  if (end !== trimmed.length - 1) {
    throw new ExpressionError(
      'a scalar may hold a single ${ … } expression; interpolation such as ' +
        '"${a} ${b}" or "text ${x}" is not supported — use _nunjucks or _string.format',
      { column: end + 1 }
    );
  }
  return trimmed.slice(2, -1);
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
    // No checkSlug: compilation runs inside buildRefs, before addKeys has built
    // a keyMap, and shouldSuppressBuildCheck needs a configKey in that keyMap
    // to suppress. A slug here would advertise a ~ignoreBuildChecks entry that
    // can never take effect, and a malformed expression is not suppressible by
    // design — it has no meaning to carry forward.
    throw new ConfigError(message, {
      filePath: filePath ?? null,
      lineNumber: lineNumber ?? null,
      columnNumber: columnNumber ?? null,
      received: expression,
    });
  }
}

export default compileExpression;
