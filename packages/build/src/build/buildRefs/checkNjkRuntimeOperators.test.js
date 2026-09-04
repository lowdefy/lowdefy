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

import checkNjkRuntimeOperators from './checkNjkRuntimeOperators.js';

test('checkNjkRuntimeOperators throws a located ConfigError for a _state key in a text template', () => {
  expect(() =>
    checkNjkRuntimeOperators({ content: 'Hello\n  _state: user.name\n', path: 'greeting.njk' })
  ).toThrow(
    'Nunjucks template "greeting.njk" renders at build and its result is used as text, so the "_state" operator on line 2 never runs. Use the _nunjucks operator over a .txt file for a template that needs runtime values.'
  );
});

test('checkNjkRuntimeOperators reports the file, line and check slug', () => {
  try {
    checkNjkRuntimeOperators({ content: 'a\nb\n- _user.id\n', path: 'mail.txt.njk' });
  } catch (error) {
    expect(error.name).toBe('ConfigError');
    expect(error.filePath).toBe('mail.txt.njk');
    expect(error.lineNumber).toBe(3);
    expect(error.checkSlug).toBe('ref-njk-runtime-operator');
    expect(error.received).toBe('- _user.id');
  }
  expect.assertions(5);
});

test('checkNjkRuntimeOperators does not report an operator named in prose', () => {
  expect(() =>
    checkNjkRuntimeOperators({
      content: 'The _state operator reads page state.\n',
      path: 'doc.md.njk',
    })
  ).not.toThrow();
});

test('checkNjkRuntimeOperators does not report a name that merely ends in an operator name', () => {
  expect(() =>
    checkNjkRuntimeOperators({ content: 'my_state: 1\n', path: 'doc.njk' })
  ).not.toThrow();
});
