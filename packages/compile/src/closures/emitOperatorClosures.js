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

function emitOperatorClosures({ input, operators, operatorPrefix = '_' }) {
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
      return `[${node.map(emit).join(', ')}]`;
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
      return `{ ${props.join(', ')} }`;
    }
    return json(node);
  }

  return { code: `export default (_x) => (${emit(input)});\n` };
}

export default emitOperatorClosures;
