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
import { type } from '@lowdefy/helpers';

// The non-enumerable provenance markers the build stamps on config nodes. The
// parsers preserve them through `serializer.copy` (serializer.js restoreMarkers),
// so a closure must re-emit them or the `~k` chains that build-check suppression
// and error location walk are lost. Keep this list in step with serializer.js.
const MARKER_KEYS = ['~r', '~k', '~l', '~c', '~x'];

const ENVS = ['web', 'server'];

const json = (value) => JSON.stringify(value);

// A node holds operators when the reviver in webParser/serverParser would
// dispatch anywhere inside it. Non-operator subtrees never need a closure.
function hasOperators({ node, operators, operatorPrefix }) {
  if (type.isArray(node)) {
    return node.some((item) => hasOperators({ node: item, operators, operatorPrefix }));
  }
  if (!type.isObject(node)) return false;
  const keys = Object.keys(node);
  if (keys.length === 1 && keys[0].startsWith(operatorPrefix)) {
    const [op] = `_${keys[0].substring(operatorPrefix.length)}`.split('.');
    if (!type.isUndefined(operators[op])) return true;
  }
  return keys.some((key) => hasOperators({ node: node[key], operators, operatorPrefix }));
}

// `serializer.copy` runs the tree through JSON.stringify before the reviver, so
// values JSON drops must be dropped here too or the closure output diverges from
// the parser output.
function isDroppedByJson(value) {
  return type.isUndefined(value) || type.isFunction(value) || typeof value === 'symbol';
}

function emitOperatorClosures({ tree, env, operators, operatorPrefix = '_' }) {
  if (!ENVS.includes(env)) {
    throw new Error(
      `Operator closure env must be one of ${ENVS.join(', ')}. Received ${json(env)}.`
    );
  }
  if (!type.isObject(operators)) {
    throw new Error(`Operator closure operators must be an object. Received ${json(operators)}.`);
  }
  if (!type.isString(operatorPrefix)) {
    throw new Error(
      `Operator closure operatorPrefix must be a string. Received ${json(operatorPrefix)}.`
    );
  }

  const declarations = [];
  const closureNames = new Map();
  const emitted = new Map();
  let usesMarkers = false;

  function hoist(node, expression) {
    const cached = emitted.get(node);
    if (!type.isUndefined(cached)) return cached;
    const name = `_c${declarations.length}`;
    declarations.push(`const ${name} = (_x) => (${expression});`);
    const call = `${name}(_x)`;
    emitted.set(node, call);

    const key = node['~k'];
    if (!type.isUndefined(key)) {
      const existing = closureNames.get(key);
      if (!type.isUndefined(existing) && existing !== name) {
        throw new ConfigError(
          `Operator closures cannot be keyed by "~k": key "${key}" names two different operator sites. Expansion must issue fresh keys per instance.`,
          { configKey: key }
        );
      }
      closureNames.set(key, name);
    }
    return call;
  }

  // Emission order is the parsers' evaluation order: `serializer.copy` revives
  // children before their parent, and a nested call expression evaluates its
  // arguments before the call. Every non-operator node emits as a fresh literal
  // per call, so no structure is shared between evaluations.
  function markers(node, expression) {
    const present = MARKER_KEYS.filter((marker) => node[marker] !== undefined);
    if (present.length === 0) return expression;
    usesMarkers = true;
    const entries = present.map((marker) => `${json(marker)}: ${json(node[marker])}`);
    return `_m(${expression}, { ${entries.join(', ')} })`;
  }

  function emit(node, { inArray = false } = {}) {
    if (isDroppedByJson(node)) return { expression: inArray ? 'null' : 'undefined', ops: false };
    if (node === null) return { expression: 'null', ops: false };
    if (type.isDate(node)) return { expression: `new Date(${json(node.valueOf())})`, ops: false };
    if (type.isArray(node)) {
      let ops = false;
      const items = node.map((item) => {
        const child = emit(item, { inArray: true });
        ops = ops || child.ops;
        return child.expression;
      });
      const expression = markers(node, `[${items.join(', ')}]`);
      if (!ops) return { expression, ops };
      return { expression: hoist(node, expression), ops };
    }
    if (type.isObject(node)) {
      const keys = Object.keys(node);
      if (keys.length === 1 && keys[0].startsWith(operatorPrefix)) {
        const key = keys[0];
        const [op, methodName] = `_${key.substring(operatorPrefix.length)}`.split('.');
        // An unknown operator is data in the parsers; it must stay data here.
        if (!type.isUndefined(operators[op])) {
          const params = emit(node[key]);
          const call =
            `_x.evalOp(_x, ${json(op)}, ${json(methodName ?? null)}, ${params.expression}, ` +
            `${json(key)}, ${json(node['~k'] ?? null)})`;
          return { expression: hoist(node, call), ops: true };
        }
      }
      let ops = false;
      const properties = keys
        .filter((key) => !isDroppedByJson(node[key]))
        .map((key) => {
          const child = emit(node[key]);
          ops = ops || child.ops;
          return `${json(key)}: ${child.expression}`;
        });
      const expression = markers(node, `{ ${properties.join(', ')} }`);
      if (!ops) return { expression, ops };
      return { expression: hoist(node, expression), ops };
    }
    return { expression: json(node), ops: false };
  }

  emit(tree);

  const entries = [...closureNames.entries()].map(([key, name]) => `  ${json(key)}: ${name},`);
  const markerHelper = usesMarkers
    ? [
        'const _m = (value, markers) => {',
        '  for (const marker of Object.keys(markers)) {',
        '    Object.defineProperty(value, marker, {',
        '      value: markers[marker],',
        '      enumerable: false,',
        '      writable: true,',
        '      configurable: true,',
        '    });',
        '  }',
        '  return value;',
        '};',
      ].join('\n')
    : null;

  const lines = [
    '// Generated by @lowdefy/operators emitOperatorClosures. Do not edit.',
    `export const env = ${json(env)};`,
    `export const operatorPrefix = ${json(operatorPrefix)};`,
  ];
  if (markerHelper) lines.push(markerHelper);
  lines.push(...declarations);
  lines.push(`const closures = {\n${entries.join('\n')}\n};`);
  lines.push('export { closures };');
  lines.push('export default closures;');
  return `${lines.join('\n')}\n`;
}

export default emitOperatorClosures;
export { hasOperators, MARKER_KEYS };
