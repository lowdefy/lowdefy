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

import ExpressionError from './ExpressionError.js';

// Punctuators, longest first so '==' wins over '=' (no '=' token exists) and
// '<=' over '<'. Every entry is matched by exact prefix against the input.
const PUNCTUATORS = [
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '??',
  '<',
  '>',
  '!',
  '?',
  ':',
  '(',
  ')',
  '[',
  ']',
  '.',
  ',',
];

const STRING_ESCAPES = { '\\': '\\', "'": "'", '"': '"', n: '\n', t: '\t' };

function isDigit(ch) {
  return ch >= '0' && ch <= '9';
}

function isIdentStart(ch) {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
}

function isIdentPart(ch) {
  return isIdentStart(ch) || isDigit(ch);
}

function readString(src, start) {
  const quote = src[start];
  let value = '';
  let i = start + 1;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\') {
      const next = src[i + 1];
      if (!Object.hasOwn(STRING_ESCAPES, next)) {
        throw new ExpressionError(`invalid string escape "\\${next ?? ''}"`, { column: i + 1 });
      }
      value += STRING_ESCAPES[next];
      i += 2;
      continue;
    }
    if (ch === quote) {
      return { value, end: i + 1 };
    }
    value += ch;
    i += 1;
  }
  throw new ExpressionError('unterminated string literal', { column: start + 1 });
}

// A number literal, including an optional leading '-' (unary minus is only ever
// part of a number literal — there is no arithmetic, so a '-' anywhere else is
// a lex error). Returns the numeric value.
function readNumber(src, start) {
  let i = start;
  if (src[i] === '-') i += 1;
  while (i < src.length && isDigit(src[i])) i += 1;
  if (src[i] === '.') {
    i += 1;
    if (!isDigit(src[i])) {
      throw new ExpressionError('malformed number: expected a digit after "."', { column: i });
    }
    while (i < src.length && isDigit(src[i])) i += 1;
  }
  if (src[i] === 'e' || src[i] === 'E') {
    i += 1;
    if (src[i] === '+' || src[i] === '-') i += 1;
    if (!isDigit(src[i])) {
      throw new ExpressionError('malformed number: expected a digit in exponent', { column: i });
    }
    while (i < src.length && isDigit(src[i])) i += 1;
  }
  return { value: Number(src.slice(start, i)), end: i };
}

// Turns the expression body (delimiters already stripped) into a flat token
// list. Columns are 1-based offsets into the body. A trailing 'eof' token
// simplifies the parser's lookahead.
function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1;
      continue;
    }
    const column = i + 1;
    if (ch === "'" || ch === '"') {
      const { value, end } = readString(src, i);
      tokens.push({ type: 'string', value, column });
      i = end;
      continue;
    }
    if (isDigit(ch) || (ch === '-' && isDigit(src[i + 1]))) {
      const { value, end } = readNumber(src, i);
      tokens.push({ type: 'number', value, column });
      i = end;
      continue;
    }
    if (isIdentStart(ch)) {
      let j = i + 1;
      while (j < src.length && isIdentPart(src[j])) j += 1;
      tokens.push({ type: 'ident', value: src.slice(i, j), column });
      i = j;
      continue;
    }
    const punct = PUNCTUATORS.find((p) => src.startsWith(p, i));
    if (punct) {
      tokens.push({ type: 'punct', value: punct, column });
      i += punct.length;
      continue;
    }
    throw new ExpressionError(`unexpected character "${ch}"`, { column });
  }
  tokens.push({ type: 'eof', value: null, column: src.length + 1 });
  return tokens;
}

export default tokenize;
