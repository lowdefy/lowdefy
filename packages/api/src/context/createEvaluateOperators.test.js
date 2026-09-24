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
    input: { name: { _app: 'name' } },
    location: 'test',
    payload: {},
  });
  expect(output).toEqual({ name: null });
});

test('createEvaluateOperators throws when `_app: slug` is evaluated without appMeta', () => {
  const context = testContext({ operators: { _app } });
  delete context.appMeta;
  const evaluateOperators = createEvaluateOperators(context);
  expect(() =>
    evaluateOperators({
      input: { slug: { _app: 'slug' } },
      location: 'test',
      payload: {},
    })
  ).toThrow('`slug` is required on the app but is not set. Declare `slug` in `lowdefy.yaml`.');
});

test('createEvaluateOperators forwards context.organization to the operator parser', () => {
  const organization = {
    policy: 'pinned',
    pinned: { id: 'org_1', slug: 'default', name: 'Default' },
  };
  const context = testContext({
    operators: { _test: ({ organization }) => organization },
  });
  // testContext has no organization field of its own - set it directly to
  // exercise the ServerParser pass-through.
  context.organization = organization;
  const evaluateOperators = createEvaluateOperators(context);
  const output = evaluateOperators({
    input: { org: { _test: null } },
    location: 'test',
    payload: {},
  });
  expect(output).toEqual({ org: organization });
});
