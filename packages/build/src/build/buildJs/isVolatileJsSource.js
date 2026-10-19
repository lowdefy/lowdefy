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

import { tokenizer } from 'acorn';

// Globals whose value can change with no update the engine sees: the clock, randomness and browser
// state. A client _js function that references one is re-evaluated on every pass.
// Not `location`: in a _js body it is the accessor parameter, which shadows the global, and its
// calls are recorded through the _location operator's own declaration. The global is still reached
// only through window, document, self or globalThis, which are listed.
const volatileIdentifiers = new Set([
  'Date',
  'performance',
  'window',
  'document',
  'globalThis',
  'self',
  'localStorage',
  'sessionStorage',
  'navigator',
  'crypto',
  'history',
  'screen',
  'innerWidth',
  'innerHeight',
  'matchMedia',
  // Intl formats the current time when a DateTimeFormat is given no date; Temporal.Now reads
  // the clock.
  'Intl',
  'Temporal',
]);

// Math members that are pure functions or constants. Any other use of Math - Math.random,
// Math[name], or aliasing like `const { random } = Math` - is volatile.
const pureMathMembers = new Set([
  'abs',
  'acos',
  'acosh',
  'asin',
  'asinh',
  'atan',
  'atan2',
  'atanh',
  'cbrt',
  'ceil',
  'clz32',
  'cos',
  'cosh',
  'exp',
  'expm1',
  'floor',
  'fround',
  'hypot',
  'imul',
  'log',
  'log10',
  'log1p',
  'log2',
  'max',
  'min',
  'pow',
  'round',
  'sign',
  'sin',
  'sinh',
  'sqrt',
  'tan',
  'tanh',
  'trunc',
  'E',
  'LN10',
  'LN2',
  'LOG10E',
  'LOG2E',
  'PI',
  'SQRT1_2',
  'SQRT2',
]);

// Tokenized, not pattern-matched: comments and string contents are not code (a comment saying
// "the welcome screen" must not make a function volatile), template literal expressions are, and
// a name after "." is a property (obj.screen), not the global.
function tokensOf(source) {
  try {
    return [...tokenizer(source, { ecmaVersion: 'latest', allowReturnOutsideFunction: true })];
  } catch (error) {
    return null;
  }
}

function isVolatileJsSource(source) {
  const tokens = tokensOf(source);
  // Source the tokenizer cannot read is treated as volatile: always evaluating is the safe side.
  if (tokens === null) {
    return true;
  }
  return tokens.some((token, index) => {
    if (token.type.label !== 'name') {
      return false;
    }
    const previous = tokens[index - 1];
    if (previous && (previous.type.label === '.' || previous.type.label === '?.')) {
      return false;
    }
    if (token.value === 'Math') {
      const next = tokens[index + 1];
      const member = tokens[index + 2];
      return !(next && next.type.label === '.' && member && pureMathMembers.has(member.value));
    }
    return volatileIdentifiers.has(token.value);
  });
}

export default isVolatileJsSource;
