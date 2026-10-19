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

import isVolatileJsSource from './isVolatileJsSource.js';

test.each([
  'return new Date();',
  'return Date.now();',
  'return Math.random();',
  'return Math . random();',
  "return Math['random']();",
  'return performance.now();',
  'return window.innerWidth;',
  'return document.title;',
  'return globalThis.x;',
  'return self.location.href;',
  "return localStorage.getItem('a');",
  "return sessionStorage.getItem('a');",
  'return navigator.language;',
  'return crypto.randomUUID();',
  'return history.length;',
  'return screen.width;',
  'return innerWidth;',
  'return innerHeight;',
  "return matchMedia('(min-width: 600px)').matches;",
])('isVolatileJsSource marks %s volatile', (source) => {
  expect(isVolatileJsSource(source)).toBe(true);
});

test.each([
  "return state('a') + 1;",
  "return state('updatedDate');",
  "return request('users').map((user) => user.name);",
  'return Math.max(args.a, args.b);',
  "return lowdefyGlobal('windowSize');",
  "const documentId = state('id'); return documentId;",
  "return user('name').toUpperCase();",
])('isVolatileJsSource leaves %s pure', (source) => {
  expect(isVolatileJsSource(source)).toBe(false);
});

test.each([
  'const { random } = Math; return random();',
  'const m = Math; return m.random();',
  "return new Intl.DateTimeFormat('en').format();",
  'return Temporal.Now.instant().toString();',
  'return Math[fn](1);',
])(
  'isVolatileJsSource marks %s volatile (clock or randomness without the obvious identifier)',
  (source) => {
    expect(isVolatileJsSource(source)).toBe(true);
  }
);

test.each(['return Math.max(a, b) + Math.PI;', 'return Math.round(state("total") * 100) / 100;'])(
  'isVolatileJsSource leaves pure Math use %s pure',
  (source) => {
    expect(isVolatileJsSource(source)).toBe(false);
  }
);

// In a _js body `location` is the accessor parameter, which shadows the global; its calls are
// recorded through the _location operator's own declaration at runtime.
test.each(["return location('pageId');", "return location('href');"])(
  'isVolatileJsSource leaves the location accessor %s to the _location declaration',
  (source) => {
    expect(isVolatileJsSource(source)).toBe(false);
  }
);

test.each([
  "// the welcome\n// screen, not the model\nreturn state('a');",
  "/* Date of expiry */ return state('expires');",
  "return 'window.location and Date.now() are just words here';",
  'return item.screen + row.document + obj.Date;',
])('isVolatileJsSource ignores comments, strings and property names: %s', (source) => {
  expect(isVolatileJsSource(source)).toBe(false);
});

test.each([
  'return `updated ${Date.now()}`;',
  "const url = 'http://example.com'; return new Date();",
  'return (x) => x /* not a regex */ / 2 + performance.now();',
])('isVolatileJsSource still finds code in templates and after tricky tokens: %s', (source) => {
  expect(isVolatileJsSource(source)).toBe(true);
});

test('isVolatileJsSource treats source it cannot tokenize as volatile', () => {
  expect(isVolatileJsSource('return `unterminated')).toBe(true);
});
