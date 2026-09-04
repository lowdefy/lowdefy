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
import lintJsBody from './lintJsBodies.js';
import { CLIENT_JS_PARAMS, SERVER_JS_PARAMS } from './jsFunctionPrototypes.js';
import { CLIENT_JS_GLOBALS, SERVER_JS_GLOBALS } from './jsGlobals.js';

function lintClient(body) {
  return lintJsBody({ body, params: CLIENT_JS_PARAMS, globals: CLIENT_JS_GLOBALS });
}

function lintServer(body) {
  return lintJsBody({ body, params: SERVER_JS_PARAMS, globals: SERVER_JS_GLOBALS });
}

test('lintJsBody reports an undefined name with its body line', () => {
  const result = lintClient('const rec = state("a");\nreturn unlinked.stamp + rec;');
  expect(result.syntaxError).toBeUndefined();
  expect(result.undefinedNames).toEqual([{ name: 'unlinked', line: 2, column: 7 }]);
  expect(result.unusedNames).toEqual([]);
});

test('lintJsBody reports each undefined name once keeping the first location', () => {
  const result = lintClient('return foo + foo;');
  expect(result.undefinedNames).toEqual([{ name: 'foo', line: 1, column: 7 }]);
});

test('lintJsBody accepts a prototype parameter as defined', () => {
  const result = lintClient('return state("a") + urlQuery("b");');
  expect(result.undefinedNames).toEqual([]);
  expect(result.unusedNames).toEqual([]);
});

test('lintJsBody accepts standard library names as defined', () => {
  const result = lintClient('return JSON.stringify(Math.max(1, Date.now())) + document.title;');
  expect(result.undefinedNames).toEqual([]);
});

test('lintJsBody flags document as undefined under server params', () => {
  const result = lintServer('return document.title;');
  expect(result.undefinedNames).toEqual([{ name: 'document', line: 1, column: 7 }]);
});

test('lintJsBody accepts server-only globals under server params', () => {
  const result = lintServer('return Buffer.from(process.env.X ?? "").toString();');
  expect(result.undefinedNames).toEqual([]);
});

test('lintJsBody reports an unused const', () => {
  const result = lintClient('const stampAt = 1;\nreturn 2;');
  expect(result.undefinedNames).toEqual([]);
  expect(result.unusedNames).toEqual([{ name: 'stampAt', line: 1, column: 6 }]);
});

test('lintJsBody reports an unused function declaration', () => {
  const result = lintClient('function helper() { return 1; }\nreturn 2;');
  expect(result.unusedNames).toEqual([{ name: 'helper', line: 1, column: 9 }]);
});

test('lintJsBody does not report a let that is used later', () => {
  const result = lintClient('let total = 0;\ntotal += 1;\nreturn total;');
  expect(result.unusedNames).toEqual([]);
});

test('lintJsBody does not report parameters of inner functions', () => {
  const result = lintClient('return [1, 2].map((item, index) => item);');
  expect(result.unusedNames).toEqual([]);
});

test('lintJsBody returns only a syntaxError when the body does not parse', () => {
  const result = lintClient('const a = 1;\nreturn (a;');
  expect(result).toEqual({
    syntaxError: { message: 'Unexpected token ;', line: 2, column: 10 },
  });
});

test('lintJsBody accepts await inside an async IIFE', () => {
  const result = lintClient(
    'return (async () => {\n  const res = await fetch("/x");\n  return res.json();\n})();'
  );
  expect(result.syntaxError).toBeUndefined();
  expect(result.undefinedNames).toEqual([]);
  expect(result.unusedNames).toEqual([]);
});

test('lintJsBody does not report an unused catch binding', () => {
  const result = lintClient('try {\n  return state("a");\n} catch (e) {\n  return null;\n}');
  expect(result.unusedNames).toEqual([]);
  expect(result.undefinedNames).toEqual([]);
});

test('lintJsBody accepts typed arrays, AbortSignal and queueMicrotask in a client body', () => {
  const result = lintClient(
    'const buffer = new Uint8Array(new ArrayBuffer(8));\nqueueMicrotask(() => performance.now());\nreturn fetch("/x", { signal: AbortSignal.timeout(10) }).then(() => buffer.length);'
  );
  expect(result.undefinedNames).toEqual([]);
});

test('lintJsBody accepts atob and btoa in a server body', () => {
  const result = lintServer('return atob(btoa("a"));');
  expect(result.undefinedNames).toEqual([]);
});
