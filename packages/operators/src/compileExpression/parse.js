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

import ExpressionError from './ExpressionError.js';

const ROOTS = new Set([
  'state',
  'request',
  'payload',
  'user',
  'event',
  'actions',
  'step',
  'item',
  'global',
  'url_query',
]);

const FUNCTIONS = new Set(['len', 'has', 'lower']);

const KEYWORDS = { true: true, false: false, null: null };

const EQUALITY = new Set(['==', '!=']);
const RELATIONAL = new Set(['<', '<=', '>', '>=']);

// A node is boolean-typed when it can only ever evaluate to true/false: a
// comparison, a boolean combinator, a negation, or has(). The ternary test
// (§6.4) must be one of these — _if throws on a non-boolean test at runtime.
function isBooleanNode(node) {
  return (
    node.kind === 'binary' ||
    node.kind === 'logical' ||
    node.kind === 'not' ||
    (node.kind === 'call' && node.name === 'has')
  );
}

// Recursive-descent parser over the token list. Precedence, lowest to highest:
// ternary < (?? | ||) < && < equality < relational < unary < postfix < primary.
// ?? may not mix with && / || without parentheses (§4.3), enforced by
// recording grouped nodes in the parser's own set — grouping is a fact about
// the parse, not a property of the operand, and must not leak into the nodes
// emit switches on.
function parse(tokens) {
  let pos = 0;
  const grouped = new WeakSet();

  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  const isPunct = (value) => {
    const t = tokens[pos];
    return t.type === 'punct' && t.value === value;
  };

  const expectPunct = (value) => {
    if (!isPunct(value)) {
      const t = peek();
      throw new ExpressionError(`expected "${value}" but found ${describe(t)}`, {
        column: t.column,
      });
    }
    return next();
  };

  function describe(token) {
    if (token.type === 'eof') return 'end of expression';
    if (token.type === 'string') return `string ${JSON.stringify(token.value)}`;
    if (token.type === 'number') return `number ${token.value}`;
    return `"${token.value}"`;
  }

  // Index ::= Number | String (§4.2). A negative literal is rejected rather
  // than folded into the path: "state.a[-1]" would emit { _state: 'a.-1' },
  // a path that resolves to undefined at runtime with no error. There is no
  // last-element read in the grammar.
  function assertIndexToken(index) {
    if (index.type !== 'number' && index.type !== 'string') {
      throw new ExpressionError(
        `index must be a literal number or string but found ${describe(index)}`,
        { column: index.column }
      );
    }
    if (index.type === 'number' && index.value < 0) {
      throw new ExpressionError(
        `index must not be negative but found number ${index.value}; ` +
          'there is no negative indexing — read the element by its position',
        { column: index.column }
      );
    }
  }

  function parseExpression() {
    return parseTernary();
  }

  function parseTernary() {
    const test = parseCoalesce();
    if (isPunct('?')) {
      if (!isBooleanNode(test)) {
        throw new ExpressionError(
          'ternary condition must be a boolean expression (a comparison or &&/||/!); ' +
            'write an explicit comparison such as "state.name != null ? … : …"',
          { column: peek().column }
        );
      }
      next();
      const consequent = parseExpression();
      expectPunct(':');
      const alternate = parseExpression();
      return { kind: 'ternary', test, then: consequent, else: alternate };
    }
    return test;
  }

  function parseCoalesce() {
    const first = parseLogicalOr();
    if (isPunct('??')) {
      assertNotBareLogical(first);
      const args = [first];
      while (isPunct('??')) {
        next();
        const operand = parseLogicalOr();
        assertNotBareLogical(operand);
        args.push(operand);
      }
      // ?? is right-associative in effect for _if_none pairs; fold right.
      return args.reduceRight(
        (acc, node) => (acc === null ? node : { kind: 'nullish', left: node, right: acc }),
        null
      );
    }
    return first;
  }

  function assertNotBareLogical(node) {
    if (node.kind === 'logical' && !grouped.has(node)) {
      throw new ExpressionError(
        '"??" cannot be combined with "&&" or "||" without parentheses; ' +
          'write (a ?? b) && c or a ?? (b && c)',
        { column: peek().column }
      );
    }
  }

  function parseLogicalOr() {
    let left = parseLogicalAnd();
    if (isPunct('||')) {
      const args = [left];
      while (isPunct('||')) {
        next();
        args.push(parseLogicalAnd());
      }
      left = { kind: 'logical', op: '||', args };
    }
    return left;
  }

  function parseLogicalAnd() {
    let left = parseEquality();
    if (isPunct('&&')) {
      const args = [left];
      while (isPunct('&&')) {
        next();
        args.push(parseEquality());
      }
      left = { kind: 'logical', op: '&&', args };
    }
    return left;
  }

  function parseEquality() {
    const left = parseRelational();
    const t = peek();
    if (t.type === 'punct' && EQUALITY.has(t.value)) {
      next();
      const right = parseRelational();
      const after = peek();
      if (after.type === 'punct' && (EQUALITY.has(after.value) || RELATIONAL.has(after.value))) {
        throw new ExpressionError(
          'comparisons are non-associative; "a == b == c" is ambiguous — chain with &&',
          { column: after.column }
        );
      }
      return { kind: 'binary', op: t.value, left, right };
    }
    return left;
  }

  function parseRelational() {
    const left = parseUnary();
    const t = peek();
    if (t.type === 'punct' && RELATIONAL.has(t.value)) {
      next();
      const right = parseUnary();
      const after = peek();
      if (after.type === 'punct' && (EQUALITY.has(after.value) || RELATIONAL.has(after.value))) {
        throw new ExpressionError(
          'comparisons are non-associative; "a < b < c" is ambiguous — chain with &&',
          { column: after.column }
        );
      }
      return { kind: 'binary', op: t.value, left, right };
    }
    return left;
  }

  function parseUnary() {
    if (isPunct('!')) {
      next();
      return { kind: 'not', arg: parseUnary() };
    }
    return parsePostfix();
  }

  function parsePostfix() {
    let node = parsePrimary();
    for (;;) {
      // .length is the length operator, never a member read (§4.5); a field
      // literally named "length" is read via index form, e.g. state['length'].
      if (isPunct('.') && tokens[pos + 1]?.type === 'ident' && tokens[pos + 1].value === 'length') {
        next();
        next();
        node = { kind: 'length', arg: node };
        continue;
      }
      if (isPunct('.')) {
        next();
        const key = next();
        if (key.type !== 'ident') {
          throw new ExpressionError(
            `expected a property name after "." but found ${describe(key)}`,
            {
              column: key.column,
            }
          );
        }
        node = { kind: 'member', object: node, key: key.value };
        continue;
      }
      if (isPunct('[')) {
        next();
        const index = next();
        assertIndexToken(index);
        expectPunct(']');
        node = { kind: 'member', object: node, key: String(index.value) };
        continue;
      }
      return node;
    }
  }

  // Greedily collapses a root/var path: consecutive .ident (except .length) and
  // [literal] segments become dotted path parts (indices become numeric
  // segments). Stops at .length so the postfix layer wraps it as _array.length.
  function collapsePath() {
    const parts = [];
    for (;;) {
      if (isPunct('.') && tokens[pos + 1]?.type === 'ident' && tokens[pos + 1].value === 'length') {
        break;
      }
      if (isPunct('.')) {
        next();
        const seg = next();
        if (seg.type !== 'ident') {
          throw new ExpressionError(
            `expected a property name after "." but found ${describe(seg)}`,
            {
              column: seg.column,
            }
          );
        }
        parts.push(seg.value);
        continue;
      }
      if (isPunct('[')) {
        next();
        const index = next();
        assertIndexToken(index);
        expectPunct(']');
        parts.push(String(index.value));
        continue;
      }
      break;
    }
    return parts;
  }

  function parsePrimary() {
    const t = peek();

    if (t.type === 'number' || t.type === 'string') {
      next();
      return { kind: 'literal', value: t.value };
    }

    if (t.type === 'ident') {
      if (Object.hasOwn(KEYWORDS, t.value)) {
        next();
        return { kind: 'literal', value: KEYWORDS[t.value] };
      }
      if (FUNCTIONS.has(t.value)) {
        return parseCall();
      }
      if (t.value === 'var') {
        next();
        const parts = collapsePath();
        if (parts.length === 0) {
          throw new ExpressionError('"var" must be followed by a name, e.g. var.myVar', {
            column: t.column,
          });
        }
        return { kind: 'var', name: parts[0], path: parts.slice(1).join('.') };
      }
      if (ROOTS.has(t.value)) {
        next();
        const parts = collapsePath();
        return { kind: 'path', root: t.value, path: parts.join('.') };
      }
      // An unknown identifier immediately followed by "(" is an unknown
      // function call; otherwise an unknown identifier root.
      if (tokens[pos + 1]?.type === 'punct' && tokens[pos + 1].value === '(') {
        throw new ExpressionError(
          `unknown function "${t.value}"; available functions are ${[...FUNCTIONS].join(', ')}`,
          { column: t.column }
        );
      }
      throw new ExpressionError(
        `unknown identifier "${t.value}"; expected a root (${[...ROOTS, 'var'].join(', ')}), ` +
          `a function (${[...FUNCTIONS].join(', ')}), or a literal`,
        { column: t.column }
      );
    }

    if (isPunct('(')) {
      next();
      const inner = parseExpression();
      expectPunct(')');
      grouped.add(inner);
      return inner;
    }

    throw new ExpressionError(`unexpected ${describe(t)}; expected an operand`, {
      column: t.column,
    });
  }

  function parseCall() {
    const nameToken = next();
    const name = nameToken.value;
    if (!isPunct('(')) {
      throw new ExpressionError(`expected "(" after function "${name}"`, { column: peek().column });
    }
    next();
    const args = [];
    if (!isPunct(')')) {
      args.push(parseExpression());
      while (isPunct(',')) {
        next();
        args.push(parseExpression());
      }
    }
    expectPunct(')');
    checkArity(name, args, nameToken.column);
    return { kind: 'call', name, args };
  }

  function checkArity(name, args, column) {
    const arity = { len: 1, lower: 1, has: 2 }[name];
    if (args.length !== arity) {
      throw new ExpressionError(
        `${name}() takes ${arity} argument${arity === 1 ? '' : 's'} but got ${args.length}`,
        { column }
      );
    }
  }

  const ast = parseExpression();
  const trailing = peek();
  if (trailing.type !== 'eof') {
    throw new ExpressionError(`unexpected ${describe(trailing)} after expression`, {
      column: trailing.column,
    });
  }
  return ast;
}

export default parse;
