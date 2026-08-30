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
import YAML from 'yaml';

import addLineNumbers from './addLineNumbers.js';

function parse(content, filePath = 'pages/home.yaml') {
  const doc = YAML.parseDocument(content);
  return addLineNumbers(doc.contents, content, undefined, { filePath });
}

test('compiles a ${ … } scalar to an operator tree', () => {
  const result = parse(`visible: \${ state.answer_detail.source == 'ai' }\n`);
  expect(result).toEqual({
    visible: { _eq: [{ _state: 'answer_detail.source' }, 'ai'] },
  });
});

test('stamps line and column on every compiled node and expression on the root', () => {
  const result = parse(`a: b\nvisible: \${ state.x == 1 }\n`);
  const root = result.visible;
  expect(root['~l']).toBe(2);
  // "${" starts at column 10 on line 2 (after "visible: ").
  expect(root['~c']).toBe(10);
  expect(root['~x']).toBe('${ state.x == 1 }');
  // nested nodes carry the same position, no ~x
  const nested = root._eq[0];
  expect(nested['~l']).toBe(2);
  expect(nested['~c']).toBe(10);
  expect(nested['~x']).toBeUndefined();
});

test('does not compile inside a _js body', () => {
  const result = parse('handler:\n  _js:\n    code: "${ state.x }"\n');
  expect(result.handler._js.code).toBe('${ state.x }');
});

test('does not compile inside a _nunjucks template', () => {
  const result = parse('label:\n  _nunjucks:\n    template: "${ not compiled }"\n');
  expect(result.label._nunjucks.template).toBe('${ not compiled }');
});

test('$${ … } is a literal string, not an expression', () => {
  // isExpression rejects the $$ escape; the scalar stays a literal. The
  // one-$ unescaping is documented but the raw string is preserved here.
  const result = parse('label: "$${ state.x }"\n');
  expect(result.label).toBe('$${ state.x }');
});

test('a plain string is untouched', () => {
  const result = parse('title: Hello world\n');
  expect(result.title).toBe('Hello world');
});

test('compiles expressions inside sequences', () => {
  const result = parse(`items:\n  - \${ state.a > 0 }\n`);
  expect(result.items[0]).toEqual({ _gt: [{ _state: 'a' }, 0] });
});

test('a malformed expression throws a located ConfigError with checkSlug expression', () => {
  let thrown;
  try {
    parse('visible: "${ stat.x }"\n');
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(ConfigError);
  expect(thrown.checkSlug).toBe('expression');
  expect(thrown.filePath).toBe('pages/home.yaml');
  expect(thrown.lineNumber).toBe(1);
  expect(thrown.columnNumber).toBe(10);
  expect(thrown.message).toMatch(/unknown identifier "stat"/);
});
