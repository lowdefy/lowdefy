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

import { type } from '@lowdefy/helpers';

// S3 stage B: compile a RESOLVED config tree (post-build data, operator
// objects still verbatim) into a closure module. Operator positions become
// evalOp calls composing bottom-up — the exact evaluation order of the
// parsers' serializer reviver — and everything else becomes fresh literals
// per call (parser serializer.copy parity: no shared structures escape).
// All user-sourced strings emit through JSON.stringify (design D12).
const json = (value) => JSON.stringify(value);

function hasOperators(node, operators, operatorPrefix = '_') {
  if (type.isArray(node)) {
    return node.some((item) => hasOperators(item, operators, operatorPrefix));
  }
  if (type.isObject(node)) {
    const keys = Object.keys(node);
    if (keys.length === 1 && keys[0].startsWith(operatorPrefix)) {
      const op = `_${keys[0].slice(operatorPrefix.length)}`.split('.')[0];
      if (!type.isUndefined(operators[op])) {
        return true;
      }
    }
    return keys.some((key) => hasOperators(node[key], operators, operatorPrefix));
  }
  return false;
}

// The closure-body expression for one tree — shared by whole-config closure
// modules (server requests) and page parse-root closures (S3c). When a
// markerHelper identifier is given, hidden provenance markers (~k) on data
// nodes re-emit non-enumerably — matching the parsers, whose serializer
// round-trip preserves them invisibly.
function emitClosureExpression({ input, operators, operatorPrefix = '_', markerHelper = null }) {
  function withMarkers(node, expr) {
    if (!markerHelper || node['~k'] === undefined) {
      return expr;
    }
    return `${markerHelper}(${expr}, { "~k": ${json(node['~k'])} })`;
  }

  function emit(node) {
    if (node === undefined) {
      return 'undefined';
    }
    if (node === null) {
      return 'null';
    }
    if (type.isDate(node)) {
      return `new Date(${json(node.toISOString())})`;
    }
    if (type.isArray(node)) {
      return withMarkers(node, `[${node.map(emit).join(', ')}]`);
    }
    if (type.isObject(node)) {
      const keys = Object.keys(node);
      if (keys.length === 1 && keys[0].startsWith(operatorPrefix)) {
        const key = keys[0];
        const [op, methodName] = `_${key.slice(operatorPrefix.length)}`.split('.');
        // Unknown operators pass through as data — parser parity.
        if (!type.isUndefined(operators[op])) {
          const configKey = node['~k'];
          return (
            `_x.evalOp(_x, ${json(op)}, ${json(methodName ?? null)}, ` +
            `${emit(node[key])}, ${json(key)}, ${json(configKey ?? null)})`
          );
        }
      }
      const props = keys.map((key) => `${json(key)}: ${emit(node[key])}`);
      return withMarkers(node, `{ ${props.join(', ')} }`);
    }
    return json(node);
  }

  return emit(input);
}

function emitOperatorClosures({ input, operators, operatorPrefix = '_' }) {
  return {
    code: `export default (_x) => (${emitClosureExpression({
      input,
      operators,
      operatorPrefix,
    })});\n`,
  };
}

export default emitOperatorClosures;
export { emitClosureExpression, hasOperators };
