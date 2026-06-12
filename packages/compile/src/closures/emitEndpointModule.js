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

import { emitClosureExpression, hasOperators } from './emitOperatorClosures.js';

// S3a (endpoints): compile an endpoint config from the build's in-memory
// form into a module. Routines evaluate PER STEP with accumulating env, so
// a whole-config closure is wrong — instead, exactly the keys the routine
// runner evaluates emit as closures when they contain server operators:
// control inputs (:if, :in, :case, :return, :reject, :throw, :cause,
// :set_state, :log, :level) and step `properties` (request/endpoint/
// validate steps). The routine structure stays data for the runner to
// traverse; hidden ~k markers re-emit non-enumerably (the runner reads
// control['~k'] for locations).
const ROUTINE_CLOSURE_KEYS = [
  ':case',
  ':cause',
  ':if',
  ':in',
  ':level',
  ':log',
  ':reject',
  ':return',
  ':set_state',
  ':throw',
  'properties',
];

const json = (value) => JSON.stringify(value);

const MARKER_HELPER =
  'const _m = (o, marks) => {\n' +
  '  for (const k of Object.keys(marks)) {\n' +
  '    Object.defineProperty(o, k, { value: marks[k], enumerable: false, writable: true, configurable: true });\n' +
  '  }\n' +
  '  return o;\n' +
  '};\n';

function emitEndpointModule({ endpoint, operators, operatorPrefix = '_' }) {
  function closure(node) {
    return `(_x) => (${emitClosureExpression({
      input: node,
      operators,
      operatorPrefix,
      markerHelper: '_m',
    })})`;
  }

  function withMarkers(node, expr) {
    if (node['~k'] === undefined) {
      return expr;
    }
    return `_m(${expr}, { "~k": ${json(node['~k'])} })`;
  }

  function emitRoutine(node) {
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
      return withMarkers(node, `[${node.map(emitRoutine).join(', ')}]`);
    }
    if (type.isObject(node)) {
      const props = Object.keys(node).map((key) => {
        const value = node[key];
        if (ROUTINE_CLOSURE_KEYS.includes(key) && hasOperators(value, operators, operatorPrefix)) {
          return `${json(key)}: ${closure(value)}`;
        }
        return `${json(key)}: ${emitRoutine(value)}`;
      });
      return withMarkers(node, `{ ${props.join(', ')} }`);
    }
    return json(node);
  }

  return { code: `${MARKER_HELPER}export default () => (${emitRoutine(endpoint)});\n` };
}

export default emitEndpointModule;
