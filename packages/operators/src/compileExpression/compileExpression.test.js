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
import { ConfigError } from '@lowdefy/errors';

import compileExpression from './compileExpression.js';

// Golden corpus: each expression compiled must serialize byte-identically to
// the hand-written operator tree. This is the sub-design's headline acceptance.
const goldenFixtures = [
  // literals
  { expression: '${ 1 }', ir: 1 },
  { expression: '${ -2.5 }', ir: -2.5 },
  { expression: "${ 'ai' }", ir: 'ai' },
  { expression: '${ "ai" }', ir: 'ai' },
  { expression: '${ true }', ir: true },
  { expression: '${ false }', ir: false },
  { expression: '${ null }', ir: null },

  // roots (all eleven)
  { expression: '${ state.x }', ir: { _state: 'x' } },
  { expression: '${ state.a.b }', ir: { _state: 'a.b' } },
  { expression: '${ state }', ir: { _state: true } },
  { expression: '${ request.get_file.status }', ir: { _request: 'get_file.status' } },
  { expression: '${ payload.id }', ir: { _payload: 'id' } },
  { expression: '${ user.roles }', ir: { _user: 'roles' } },
  { expression: '${ event.value }', ir: { _event: 'value' } },
  { expression: '${ actions.save.response }', ir: { _actions: 'save.response' } },
  { expression: '${ step.job.id }', ir: { _step: 'job.id' } },
  { expression: '${ item.name }', ir: { _item: 'name' } },
  { expression: '${ global.tenant }', ir: { _global: 'tenant' } },
  { expression: '${ url_query.slug }', ir: { _url_query: 'slug' } },

  // index and path collapsing
  { expression: '${ state.arr[0].field }', ir: { _state: 'arr.0.field' } },
  { expression: "${ state['a'].b }", ir: { _state: 'a.b' } },
  { expression: "${ state['weird.key'] }", ir: { _state: 'weird.key' } },

  // var
  { expression: '${ var.limit }', ir: { _var: 'limit' } },
  { expression: '${ var.cfg.max }', ir: { _get: { from: { _var: 'cfg' }, key: 'max' } } },

  // comparison
  { expression: "${ state.x == 'ai' }", ir: { _eq: [{ _state: 'x' }, 'ai'] } },
  { expression: "${ state.x != 'ai' }", ir: { _ne: [{ _state: 'x' }, 'ai'] } },
  { expression: '${ state.n > 0 }', ir: { _gt: [{ _state: 'n' }, 0] } },
  { expression: '${ state.n >= 0 }', ir: { _gte: [{ _state: 'n' }, 0] } },
  { expression: '${ state.n < 0 }', ir: { _lt: [{ _state: 'n' }, 0] } },
  { expression: '${ state.n <= 0 }', ir: { _lte: [{ _state: 'n' }, 0] } },

  // boolean
  {
    expression: '${ state.a && state.b }',
    ir: { _and: [{ _state: 'a' }, { _state: 'b' }] },
  },
  {
    expression: '${ state.a && state.b && state.c }',
    ir: { _and: [{ _state: 'a' }, { _state: 'b' }, { _state: 'c' }] },
  },
  {
    expression: '${ state.a || state.b }',
    ir: { _or: [{ _state: 'a' }, { _state: 'b' }] },
  },
  { expression: '${ !state.a }', ir: { _not: { _state: 'a' } } },

  // nullish
  {
    expression: "${ state.a ?? 'default' }",
    ir: { _if_none: [{ _state: 'a' }, 'default'] },
  },
  {
    expression: '${ state.a ?? state.b ?? state.c }',
    ir: { _if_none: [{ _state: 'a' }, { _if_none: [{ _state: 'b' }, { _state: 'c' }] }] },
  },

  // ternary (boolean test)
  {
    expression: "${ state.x == 'ai' ? 'yes' : 'no' }",
    ir: { _if: { test: { _eq: [{ _state: 'x' }, 'ai'] }, then: 'yes', else: 'no' } },
  },

  // length / len / has / lower
  { expression: '${ state.items.length }', ir: { '_array.length': { _state: 'items' } } },
  { expression: '${ len(state.items) }', ir: { '_array.length': { _state: 'items' } } },
  {
    expression: "${ has(user.roles, 'admin') }",
    ir: { '_array.includes': [{ _user: 'roles' }, 'admin'] },
  },
  { expression: '${ lower(state.q) }', ir: { '_string.toLowerCase': { _state: 'q' } } },

  // precedence and grouping
  {
    expression: '${ state.a && state.b || state.c }',
    ir: { _or: [{ _and: [{ _state: 'a' }, { _state: 'b' }] }, { _state: 'c' }] },
  },
  {
    expression: '${ state.a && (state.b || state.c) }',
    ir: { _and: [{ _state: 'a' }, { _or: [{ _state: 'b' }, { _state: 'c' }] }] },
  },
  {
    expression: '${ (state.a ?? state.b) && state.c }',
    ir: { _and: [{ _if_none: [{ _state: 'a' }, { _state: 'b' }] }, { _state: 'c' }] },
  },

  // the design's worked example
  {
    expression: "${ state.answer_detail.source == 'ai' && len(state.evidence_ids) > 0 }",
    ir: {
      _and: [
        { _eq: [{ _state: 'answer_detail.source' }, 'ai'] },
        { _gt: [{ '_array.length': { _state: 'evidence_ids' } }, 0] },
      ],
    },
  },

  // precedence torture
  // ! binds tighter than comparison, comparison tighter than &&, && tighter than ||
  {
    expression: '${ !state.a && state.b || state.c && !state.d }',
    ir: {
      _or: [
        { _and: [{ _not: { _state: 'a' } }, { _state: 'b' }] },
        { _and: [{ _state: 'c' }, { _not: { _state: 'd' } }] },
      ],
    },
  },
  {
    expression: '${ state.a == 1 && state.b != 2 || state.c > 3 }',
    ir: {
      _or: [
        { _and: [{ _eq: [{ _state: 'a' }, 1] }, { _ne: [{ _state: 'b' }, 2] }] },
        { _gt: [{ _state: 'c' }, 3] },
      ],
    },
  },
  // equality may take a relational operand (grammar: Equality ::= Relational (op Relational)?)
  {
    expression: '${ state.a == state.b < state.c }',
    ir: { _eq: [{ _state: 'a' }, { _lt: [{ _state: 'b' }, { _state: 'c' }] }] },
  },
  // ternary is right-associative through its else branch
  {
    expression: "${ state.a == 1 ? 'x' : state.b == 2 ? 'y' : 'z' }",
    ir: {
      _if: {
        test: { _eq: [{ _state: 'a' }, 1] },
        then: 'x',
        else: { _if: { test: { _eq: [{ _state: 'b' }, 2] }, then: 'y', else: 'z' } },
      },
    },
  },
  // ! of a parenthesised group, and a parenthesised ?? as a logical operand
  {
    expression: '${ !(state.a && state.b) }',
    ir: { _not: { _and: [{ _state: 'a' }, { _state: 'b' }] } },
  },
  {
    expression: '${ state.a && (state.b ?? false) }',
    ir: { _and: [{ _state: 'a' }, { _if_none: [{ _state: 'b' }, false] }] },
  },
  // ?? binds looser than comparison: a compare result may be ??-defaulted
  {
    expression: '${ state.a > 1 ?? false }',
    ir: { _if_none: [{ _gt: [{ _state: 'a' }, 1] }, false] },
  },
  // .length composes with comparison and function calls
  {
    expression: '${ state.rows.length > 0 && !has(state.hidden, state.rows[0].id) }',
    ir: {
      _and: [
        { _gt: [{ '_array.length': { _state: 'rows' } }, 0] },
        { _not: { '_array.includes': [{ _state: 'hidden' }, { _state: 'rows.0.id' }] } },
      ],
    },
  },
  // has() is boolean-typed, so it is a valid ternary test
  {
    expression: "${ has(user.roles, 'admin') ? 'all' : 'own' }",
    ir: {
      _if: {
        test: { '_array.includes': [{ _user: 'roles' }, 'admin'] },
        then: 'all',
        else: 'own',
      },
    },
  },
  // member read off a non-root expression falls back to _get
  {
    expression: "${ (state.a ?? state.b).city == 'PTA' }",
    ir: {
      _eq: [
        { _get: { from: { _if_none: [{ _state: 'a' }, { _state: 'b' }] }, key: 'city' } },
        'PTA',
      ],
    },
  },
];

describe('compileExpression golden corpus', () => {
  goldenFixtures.forEach(({ expression, ir }) => {
    test(`compiles ${expression} byte-identically`, () => {
      const compiled = compileExpression({ expression });
      expect(serializer.serializeToString(compiled)).toEqual(serializer.serializeToString(ir));
    });
  });
});

// Negative corpus: each must throw a located ConfigError
// and a message matching the shape.
const errorFixtures = [
  { expression: '${ state.x ==', match: /single, closed/ },
  { expression: '${ state.x == 1 } ${ state.y }', match: /single \$\{ … \} expression/ },
  { expression: '${ state.a == }', match: /expected an operand/ },
  { expression: '${ stat.x }', match: /unknown identifier "stat"/ },
  { expression: '${ count(state.x) }', match: /unknown function "count"/ },
  { expression: '${ state.a == == "b" }', match: /expected an operand/ },
  { expression: '${ state.a ?? state.b && state.c }', match: /cannot be combined with/ },
  { expression: '${ state.name ? "a" : "b" }', match: /ternary condition must be a boolean/ },
  { expression: '${ state.a == state.b == state.c }', match: /non-associative/ },
  { expression: '${ len(state.a, state.b) }', match: /len\(\) takes 1 argument/ },
  // mixing ?? with && on either side without parentheses
  { expression: '${ state.a && state.b ?? state.c }', match: /cannot be combined with/ },
  // a nullish chain is not boolean-typed, so it cannot be a ternary test
  {
    expression: "${ state.a ?? state.b ? 'x' : 'y' }",
    match: /ternary condition must be a boolean/,
  },
  // chained relational comparisons
  { expression: '${ state.a < state.b < state.c }', match: /non-associative/ },
  // arithmetic is not in the language
  { expression: '${ state.a - 1 > 0 }', match: /unexpected character "-"/ },
  { expression: '${ state.a + 1 > 0 }', match: /unexpected character "\+"/ },
  // a negative index would emit the nonsense path { _state: 'a.-1' } (B-50)
  { expression: '${ state.a[-1] }', match: /index must not be negative/ },
  { expression: '${ len(state.a)[-2] }', match: /index must not be negative/ },
];

describe('compileExpression parse errors', () => {
  errorFixtures.forEach(({ expression, match }) => {
    test(`rejects ${expression}`, () => {
      let thrown;
      try {
        compileExpression({ expression });
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toBeInstanceOf(ConfigError);
      // No checkSlug: the error is thrown inside buildRefs, before any keyMap
      // exists, so ~ignoreBuildChecks could never suppress it.
      expect(thrown.checkSlug).toBeUndefined();
      expect(thrown.message).toMatch(match);
    });
  });

  test('carries file position structurally when location is supplied', () => {
    let thrown;
    try {
      compileExpression({
        expression: '${ stat.x }',
        filePath: 'pages/home.yaml',
        lineNumber: 42,
        columnNumber: 12,
      });
    } catch (error) {
      thrown = error;
    }
    expect(thrown.filePath).toBe('pages/home.yaml');
    expect(thrown.lineNumber).toBe(42);
    expect(thrown.columnNumber).toBe(12);
    // The within-expression column and source are in the message.
    expect(thrown.message).toContain('at column 2 of the expression');
    expect(thrown.message).toContain('in ${ stat.x }.');
  });
});
