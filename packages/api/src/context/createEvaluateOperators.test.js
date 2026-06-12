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

import { _app } from '@lowdefy/operators-js/operators/server';

import createEvaluateOperators from './createEvaluateOperators.js';
import testContext from '../test/testContext.js';

test('createEvaluateOperators resolves `_app` against context.appMeta', () => {
  const context = testContext({
    appMeta: { slug: 'my-app', name: 'My App', version: '1.2.3' },
    operators: { _app },
  });
  const evaluateOperators = createEvaluateOperators(context);
  const output = evaluateOperators({
    input: { slug: { _app: 'slug' }, name: { _app: 'name' } },
    location: 'test',
    payload: {},
  });
  expect(output).toEqual({ slug: 'my-app', name: 'My App' });
});

test('createEvaluateOperators `_app` returns null for unknown key', () => {
  const context = testContext({
    appMeta: { slug: 'my-app' },
    operators: { _app },
  });
  const evaluateOperators = createEvaluateOperators(context);
  const output = evaluateOperators({
    input: { missing: { _app: 'unknown' } },
    location: 'test',
    payload: {},
  });
  expect(output).toEqual({ missing: null });
});

test('createEvaluateOperators forwards undefined lowdefyApp when context.appMeta absent', () => {
  const context = testContext({ operators: { _app } });
  // wipe out the testContext default to make absence explicit
  delete context.appMeta;
  const evaluateOperators = createEvaluateOperators(context);
  const output = evaluateOperators({
    input: { slug: { _app: 'slug' } },
    location: 'test',
    payload: {},
  });
  expect(output).toEqual({ slug: null });
});

test('S3a adapter: a function input evaluates as a closure with the same contract', () => {
  const operators = {
    _payload: ({ params, payload }) => payload[params] ?? null,
  };
  const evaluateOperators = createEvaluateOperators({
    appMeta: { name: 'app' },
    operators,
    secrets: {},
    user: { id: 'u1' },
  });
  // The shape emitOperatorClosures emits: (_x) => expression of evalOp calls.
  const closure = (_x) => ({
    url: '/items',
    q: _x.evalOp(_x, '_payload', null, 'query', '_payload', null),
  });
  const output = evaluateOperators({
    input: closure,
    location: 'request:test',
    payload: { query: 'abc' },
    state: {},
  });
  expect(output).toEqual({ url: '/items', q: 'abc' });
});

test('S3a adapter: closure operator errors throw like parser errors', () => {
  const operators = {
    _boom: () => {
      throw new Error('boom');
    },
  };
  const evaluateOperators = createEvaluateOperators({
    appMeta: {},
    operators,
    secrets: {},
    user: {},
  });
  const closure = (_x) => ({ a: _x.evalOp(_x, '_boom', null, 1, '_boom', null) });
  expect(() =>
    evaluateOperators({ input: closure, location: 'request:test', payload: {}, state: {} })
  ).toThrow('boom');
});
