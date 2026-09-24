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

// Globals whose value can change with no update the engine sees: the clock, randomness and browser
// state. A client _js function that references one is re-evaluated on every pass. Over-matching
// (a property named `location`, a word in a string) only costs an evaluation, so the match is on
// the bare identifier anywhere in the source.
const volatileIdentifiers = [
  'Date',
  'performance',
  'window',
  'document',
  'globalThis',
  'self',
  'localStorage',
  'sessionStorage',
  'navigator',
  // Not `location`: in a _js body it is the accessor parameter, which shadows the global, and its
  // calls are recorded through the _location operator's own declaration. The global is still
  // reached only through window, document, self or globalThis, which are listed.
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
];

// Math members that are pure functions or constants. Any other use of Math - Math.random,
// Math[name], or aliasing like `const { random } = Math` - is treated as volatile.
const pureMathMembers = [
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
];

const volatilePattern = new RegExp(
  `\\b(${volatileIdentifiers.join('|')})\\b|\\bMath\\b(?!\\s*\\.\\s*(${pureMathMembers.join(
    '|'
  )})\\b)`
);

function isVolatileJsSource(source) {
  return volatilePattern.test(source);
}

export default isVolatileJsSource;
