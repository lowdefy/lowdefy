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

// S3c: compile a WIRE-shaped page (what /api/page serves) into a page
// module. The engine's parse roots that contain client operators emit as
// closures — exactly the inputs WebParser.parse receives:
//   - per block: class, layout, loading, properties, required, skeleton,
//     slotsLayout, style, visible (validate stays data — the engine parses
//     its rule values individually);
//   - per event action: the WHOLE action object, with the engine's
//     pre-parse reads (id, type, ~k) and the raw messages (parsed
//     separately on the error path) attached as static properties;
//   - per request: payload.
// Roots without operators stay plain data and take the legacy reviver
// path, so behavior only changes where closures actually evaluate.
const BLOCK_PARSE_ROOTS = [
  'class',
  'layout',
  'loading',
  'properties',
  'required',
  'skeleton',
  'slotsLayout',
  'style',
  'visible',
];

const json = (value) => JSON.stringify(value);

// Tiny module-local helper for hidden provenance markers — the page module
// produces the engine's INTERNAL form (real arrays, non-enumerable ~k),
// bypassing the client's wire deserialization which would drop closures.
const MARKER_HELPER =
  'const _m = (o, marks) => {\n' +
  '  for (const k of Object.keys(marks)) {\n' +
  '    Object.defineProperty(o, k, { value: marks[k], enumerable: false, writable: true, configurable: true });\n' +
  '  }\n' +
  '  return o;\n' +
  '};\n';

function emitPageModule({ page, operators, operatorPrefix = '_' }) {
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

  function emitData(node) {
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
      return withMarkers(node, `[${node.map(emitData).join(', ')}]`);
    }
    if (type.isObject(node)) {
      const props = Object.keys(node).map((key) => `${json(key)}: ${emitData(node[key])}`);
      return withMarkers(node, `{ ${props.join(', ')} }`);
    }
    return json(node);
  }

  function emitAction(action) {
    if (!type.isObject(action) || !hasOperators(action, operators, operatorPrefix)) {
      return emitData(action);
    }
    const statics = [`id: ${json(action.id)}`, `type: ${json(action.type)}`];
    if (action['~k'] !== undefined) {
      statics.push(`"~k": ${json(action['~k'])}`);
    }
    if (action.messages !== undefined) {
      statics.push(`messages: ${emitData(action.messages)}`);
    }
    return `Object.assign(${closure(action)}, { ${statics.join(', ')} })`;
  }

  function emitEvents(events) {
    if (!type.isObject(events)) {
      return emitData(events);
    }
    const props = Object.keys(events).map((eventName) => {
      const value = events[eventName];
      let expr;
      if (type.isArray(value)) {
        expr = withMarkers(value, `[${value.map(emitAction).join(', ')}]`);
      } else if (type.isObject(value)) {
        // Normalized try/catch shape — actions inside each list.
        const inner = Object.keys(value).map((key) => {
          if (type.isArray(value[key])) {
            return `${json(key)}: ${withMarkers(
              value[key],
              `[${value[key].map(emitAction).join(', ')}]`
            )}`;
          }
          return `${json(key)}: ${emitData(value[key])}`;
        });
        expr = withMarkers(value, `{ ${inner.join(', ')} }`);
      } else {
        expr = emitData(value);
      }
      return `${json(eventName)}: ${expr}`;
    });
    return withMarkers(events, `{ ${props.join(', ')} }`);
  }

  function emitBlock(block) {
    if (!type.isObject(block)) {
      return emitData(block);
    }
    const props = Object.keys(block).map((key) => {
      const value = block[key];
      if (BLOCK_PARSE_ROOTS.includes(key) && hasOperators(value, operators, operatorPrefix)) {
        return `${json(key)}: ${closure(value)}`;
      }
      if (key === 'events') {
        return `${json(key)}: ${emitEvents(value)}`;
      }
      if (key === 'blocks' && type.isArray(value)) {
        return `${json(key)}: ${withMarkers(value, `[${value.map(emitBlock).join(', ')}]`)}`;
      }
      if ((key === 'slots' || key === 'areas') && type.isObject(value)) {
        const slotProps = Object.keys(value).map((slotName) => {
          const slot = value[slotName];
          if (type.isObject(slot) && type.isArray(slot.blocks)) {
            const inner = Object.keys(slot).map((slotKey) => {
              if (slotKey === 'blocks') {
                return `${json(slotKey)}: ${withMarkers(
                  slot.blocks,
                  `[${slot.blocks.map(emitBlock).join(', ')}]`
                )}`;
              }
              return `${json(slotKey)}: ${emitData(slot[slotKey])}`;
            });
            return `${json(slotName)}: ${withMarkers(slot, `{ ${inner.join(', ')} }`)}`;
          }
          return `${json(slotName)}: ${emitData(slot)}`;
        });
        return `${json(key)}: ${withMarkers(value, `{ ${slotProps.join(', ')} }`)}`;
      }
      if (key === 'requests' && type.isArray(value)) {
        const requestExprs = value.map((request) => {
          if (type.isObject(request) && hasOperators(request.payload, operators, operatorPrefix)) {
            const requestProps = Object.keys(request).map((requestKey) => {
              if (requestKey === 'payload') {
                return `${json(requestKey)}: ${closure(request.payload)}`;
              }
              return `${json(requestKey)}: ${emitData(request[requestKey])}`;
            });
            return withMarkers(request, `{ ${requestProps.join(', ')} }`);
          }
          return emitData(request);
        });
        return `${json(key)}: ${withMarkers(value, `[${requestExprs.join(', ')}]`)}`;
      }
      return `${json(key)}: ${emitData(value)}`;
    });
    return withMarkers(block, `{ ${props.join(', ')} }`);
  }

  // The page root is a block; auth never ships. Input is the build's
  // in-memory page (internal form — hidden markers readable, real arrays).
  const withoutAuth = {};
  for (const key of Object.keys(page)) {
    if (key !== 'auth') {
      withoutAuth[key] = page[key];
    }
  }
  if (page['~k'] !== undefined) {
    Object.defineProperty(withoutAuth, '~k', { value: page['~k'], enumerable: false });
  }
  return {
    code: `${MARKER_HELPER}export default () => (${emitBlock(withoutAuth)});\n`,
  };
}

export default emitPageModule;
