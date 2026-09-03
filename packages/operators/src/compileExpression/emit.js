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

// The mapping table (design §5): each AST node kind is emitted as the exact
// operator object it compiles to. Output is plain JS objects/arrays; the build
// layer stamps source positions afterwards. Every emitted operator node has
// exactly one non-~ key starting with _, satisfying the recognition rule.

const ROOT_OPERATOR = {
  state: '_state',
  request: '_request',
  payload: '_payload',
  user: '_user',
  event: '_event',
  actions: '_actions',
  step: '_step',
  item: '_item',
  global: '_global',
  url_query: '_url_query',
};

const BINARY_OPERATOR = {
  '==': '_eq',
  '!=': '_ne',
  '>': '_gt',
  '>=': '_gte',
  '<': '_lt',
  '<=': '_lte',
};

function emit(node) {
  switch (node.kind) {
    case 'literal':
      return node.value;

    case 'path': {
      const operator = ROOT_OPERATOR[node.root];
      // A bare root (no path) reads the whole object: getFromObject treats
      // `true` as "all".
      return { [operator]: node.path === '' ? true : node.path };
    }

    case 'var': {
      if (node.path === '') {
        return { _var: node.name };
      }
      return { _get: { from: { _var: node.name }, key: node.path } };
    }

    case 'member':
      return { _get: { from: emit(node.object), key: node.key } };

    case 'binary':
      return { [BINARY_OPERATOR[node.op]]: [emit(node.left), emit(node.right)] };

    case 'logical': {
      const operator = node.op === '&&' ? '_and' : '_or';
      return { [operator]: node.args.map(emit) };
    }

    case 'not':
      return { _not: emit(node.arg) };

    case 'nullish':
      return { _if_none: [emit(node.left), emit(node.right)] };

    case 'ternary':
      return { _if: { test: emit(node.test), then: emit(node.then), else: emit(node.else) } };

    case 'length':
      return { '_array.length': emit(node.arg) };

    case 'call':
      return emitCall(node);

    default:
      throw new Error(`Internal: unknown AST node kind "${node.kind}".`);
  }
}

function emitCall(node) {
  switch (node.name) {
    case 'len':
      return { '_array.length': emit(node.args[0]) };
    case 'has':
      return { '_array.includes': [emit(node.args[0]), emit(node.args[1])] };
    case 'lower':
      return { '_string.toLowerCase': emit(node.args[0]) };
    default:
      throw new Error(`Internal: unknown function "${node.name}".`);
  }
}

export default emit;
