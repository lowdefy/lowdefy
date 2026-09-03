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

test('does not compile a _js body in either the scalar or the fn form', () => {
  const scalar = parse('handler:\n  _js: "return `${ state.x }`"\n');
  expect(scalar.handler._js).toBe('return `${ state.x }`');
  const object = parse('handler:\n  _js:\n    fn: "return `${ state.x }`"\n');
  expect(object.handler._js.fn).toBe('return `${ state.x }`');
});

test('compiles a ${ … } in _js args — only the body is raw source', () => {
  const result = parse(
    'handler:\n  _js:\n    fn: ./lib/f.js#run\n    args:\n      - "${ state.a }"\n'
  );
  expect(result.handler._js.fn).toBe('./lib/f.js#run');
  expect(result.handler._js.args[0]).toEqual({ _state: 'a' });
});

test('compiles a ${ … } in _nunjucks on — only the template is raw source', () => {
  const result = parse(
    'label:\n  _nunjucks:\n    template: "{{ name }}"\n    on:\n      name: "${ state.name }"\n'
  );
  expect(result.label._nunjucks.template).toBe('{{ name }}');
  expect(result.label._nunjucks.on.name).toEqual({ _state: 'name' });
});

test('does not compile a _nunjucks template in either the scalar or the template form', () => {
  const scalar = parse('label:\n  _nunjucks: "${ not compiled }"\n');
  expect(scalar.label._nunjucks).toBe('${ not compiled }');
  const object = parse('label:\n  _nunjucks:\n    template: "${ not compiled }"\n');
  expect(object.label._nunjucks.template).toBe('${ not compiled }');
});

test('$${ … } is the literal escape: it yields the literal ${ … } string', () => {
  // isExpression rejects the $$ escape; the pre-pass removes the leading $
  // so the author gets the literal ${ … } text (design §7).
  const result = parse('label: "$${ state.x }"\n');
  expect(result.label).toBe('${ state.x }');
});

test('$$ that is not a leading escape is untouched', () => {
  const result = parse('label: "cost is $$5 and $$ more"\n');
  expect(result.label).toBe('cost is $$5 and $$ more');
});

test('$${ … } in a _js body stays fully literal, escape included', () => {
  // A raw-source body is owned by the other language; the escape only applies
  // where compilation would otherwise trigger.
  const result = parse('handler:\n  _js:\n    fn: "$${ state.x }"\n');
  expect(result.handler._js.fn).toBe('$${ state.x }');
});

test('a plain string is untouched', () => {
  const result = parse('title: Hello world\n');
  expect(result.title).toBe('Hello world');
});

test('a v7 literal that merely contains ${ … } is left alone', () => {
  const result = parse('path: "${HOME}/data"\nlabel: "${a} ${b}"\nopen: "${ state.a"\n');
  expect(result.path).toBe('${HOME}/data');
  expect(result.label).toBe('${a} ${b}');
  expect(result.open).toBe('${ state.a');
});

test('compiles expressions inside sequences', () => {
  const result = parse(`items:\n  - \${ state.a > 0 }\n`);
  expect(result.items[0]).toEqual({ _gt: [{ _state: 'a' }, 0] });
});

test('a malformed expression throws a located ConfigError', () => {
  let thrown;
  try {
    parse('visible: "${ stat.x }"\n');
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(ConfigError);
  expect(thrown.filePath).toBe('pages/home.yaml');
  expect(thrown.lineNumber).toBe(1);
  expect(thrown.columnNumber).toBe(10);
  expect(thrown.message).toMatch(/unknown identifier "stat"/);
});
