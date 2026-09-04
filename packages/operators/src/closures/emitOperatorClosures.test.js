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

import { serializer } from '@lowdefy/helpers';

import emitOperatorClosures, { hasOperators } from './emitOperatorClosures.js';
import loadClosureModule from './test/loadClosureModule.js';

const operators = { _sum: () => 1 };

test('emitOperatorClosures throws when env is not web or server', () => {
  expect(() => emitOperatorClosures({ tree: {}, env: 'build', operators })).toThrow(
    'Operator closure env must be one of web, server. Received "build".'
  );
});

test('emitOperatorClosures throws when operators is not an object', () => {
  expect(() => emitOperatorClosures({ tree: {}, env: 'web', operators: null })).toThrow(
    'Operator closure operators must be an object. Received null.'
  );
});

test('emitOperatorClosures throws when operatorPrefix is not a string', () => {
  expect(() =>
    emitOperatorClosures({ tree: {}, env: 'web', operators, operatorPrefix: 1 })
  ).toThrow('Operator closure operatorPrefix must be a string. Received 1.');
});

test('emitOperatorClosures throws when one ~k names two different operator sites', () => {
  const tree = serializer.copy({
    a: { '~k': 'shared', x: { _sum: [1], '~k': 'x' } },
    b: { '~k': 'shared', y: { _sum: [2], '~k': 'y' } },
  });
  expect(() => emitOperatorClosures({ tree, env: 'web', operators })).toThrow(
    'Operator closures cannot be keyed by "~k": key "shared" names two different operator sites.'
  );
});

test('emitOperatorClosures emits one closure per operator-bearing node, keyed by ~k', () => {
  const tree = serializer.copy({
    '~k': 'root',
    plain: { '~k': 'plain', a: 1 },
    dynamic: { '~k': 'dynamic', b: { _sum: [1], '~k': 'site' } },
  });
  const { closures, env, operatorPrefix } = loadClosureModule(
    emitOperatorClosures({ tree, env: 'web', operators })
  );
  expect(env).toBe('web');
  expect(operatorPrefix).toBe('_');
  expect(Object.keys(closures).sort()).toEqual(['dynamic', 'root', 'site']);
});

test('emitOperatorClosures reuses one declaration for a shared node reference', () => {
  const shared = serializer.copy({ '~k': 'shared', a: { _sum: [1], '~k': 'site' } });
  const code = emitOperatorClosures({
    tree: { '~k': 'root', first: shared, second: shared },
    env: 'web',
    operators,
  });
  expect(code.match(/_x\.evalOp/g)).toHaveLength(1);
});

test('emitOperatorClosures emits no module-local marker helper when there are no markers', () => {
  const code = emitOperatorClosures({ tree: { a: { _sum: [1] } }, env: 'server', operators });
  expect(code).not.toContain('const _m =');
});

test('hasOperators is false for a tree whose only operator-shaped key is unknown', () => {
  expect(hasOperators({ node: { a: { _nope: 1 } }, operators, operatorPrefix: '_' })).toBe(false);
  expect(hasOperators({ node: { a: { _sum: 1 } }, operators, operatorPrefix: '_' })).toBe(true);
});
