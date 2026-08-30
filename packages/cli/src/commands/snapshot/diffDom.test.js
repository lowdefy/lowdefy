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

import diffDom from './diffDom.js';
import normalizeDom from './normalizeDom.js';

function golden(dom) {
  return normalizeDom({ dom });
}

test('diffDom reports no drift for an identical DOM', () => {
  const dom = '<div id="root"><p id="bl-a">Hello</p></div>';
  expect(diffDom({ expected: golden(dom), actual: dom })).toEqual({ changed: false, lines: [] });
});

test('diffDom reports no drift when only an antd hash class changed', () => {
  const before =
    '<div id="root"><button class="ant-btn css-dev-only-do-not-override-aaa11">Go</button></div>';
  const after =
    '<div id="root"><button class="ant-btn css-dev-only-do-not-override-bbb22">Go</button></div>';
  expect(diffDom({ expected: golden(before), actual: after }).changed).toBe(false);
});

test('diffDom reports no drift when only an rc id changed', () => {
  const before = '<div id="root"><input id="rc_select_1"></div>';
  const after = '<div id="root"><input id="rc_select_7"></div>';
  expect(diffDom({ expected: golden(before), actual: after }).changed).toBe(false);
});

test('diffDom reports a text change as drift with the golden and current lines', () => {
  const before = '<div id="root"><h1>Title</h1><p id="bl-a">Hello</p><footer>f</footer></div>';
  const after = '<div id="root"><h1>Title</h1><p id="bl-a">Goodbye</p><footer>f</footer></div>';
  const result = diffDom({ expected: golden(before), actual: after });
  expect(result.changed).toBe(true);
  expect(result.lines).toEqual(['-3 <p id="bl-a">Hello</p>', '+3 <p id="bl-a">Goodbye</p>']);
});

test('diffDom reports an inserted element as an added line', () => {
  const before = '<div id="root"><p>a</p><p>c</p></div>';
  const after = '<div id="root"><p>a</p><p>b</p><p>c</p></div>';
  const result = diffDom({ expected: golden(before), actual: after });
  expect(result.lines).toEqual(['+3 <p>b</p>']);
});

test('diffDom reports a removed element as a removed line', () => {
  const before = '<div id="root"><p>a</p><p>b</p><p>c</p></div>';
  const after = '<div id="root"><p>a</p><p>c</p></div>';
  const result = diffDom({ expected: golden(before), actual: after });
  expect(result.lines).toEqual(['-3 <p>b</p>']);
});

test('diffDom caps the output at 20 differing lines and counts the rest', () => {
  const rows = (prefix) =>
    Array.from({ length: 30 }, (_, index) => `<p>${prefix}${index}</p>`).join('');
  const result = diffDom({
    expected: golden(`<div>${rows('a')}</div>`),
    actual: `<div>${rows('b')}</div>`,
  });
  expect(result.changed).toBe(true);
  expect(result.lines).toHaveLength(21);
  expect(result.lines[20]).toBe('... 40 more differing lines');
});

test('diffDom handles a large changed region positionally without building an alignment table', () => {
  const rows = (prefix, count) =>
    Array.from({ length: count }, (_, index) => `<p>${prefix}${index}</p>`).join('');
  const result = diffDom({
    expected: golden(`<div>${rows('a', 4000)}</div>`),
    actual: `<div>${rows('b', 4000)}</div>`,
  });
  expect(result.changed).toBe(true);
  expect(result.lines[0]).toBe('-2 <p>a0</p>');
  expect(result.lines[1]).toBe('+2 <p>b0</p>');
});
