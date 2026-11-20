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
import crypto from 'crypto';

import setNonEnumerableProperty from '../../utils/setNonEnumerableProperty.js';

const MARKERS = ['~r', '~k', '~l'];

function hashFn({ jsMap, env, value }) {
  const hash = crypto.createHash('sha1').update(value).digest('base64');
  jsMap[env][hash] = value;
  return hash;
}

function copyNode(node) {
  const copy = type.isArray(node) ? node.slice() : { ...node };
  for (const marker of MARKERS) {
    if (node[marker]) {
      setNonEnumerableProperty(copy, marker, node[marker]);
    }
  }
  return copy;
}

// The replacement is a new node without markers: the addKeys pass that follows
// keys it.
function hashJsOperator({ operator, configKey, jsMap, env }) {
  const inner = operator._js;

  if (type.isString(inner)) {
    return { _js: hashFn({ jsMap, env, value: inner }) };
  }

  if (type.isObject(inner) && type.isString(inner.fn)) {
    return { _js: { fn: hashFn({ jsMap, env, value: inner.fn }), args: inner.args } };
  }

  throw new ConfigError(
    `_js operator expects a JavaScript string or { fn: string, args?: object }. Received ${JSON.stringify(
      inner
    )}.`,
    { configKey }
  );
}

// A node that has no ~k yet was made by a build step after the last addKeys
// pass, and the build can hold it in more than one place: a menu link's auth is
// its page's auth object. The addKeys pass that follows keys every place on its
// own, so each place gets its own copy here. Children are parsed first, so a
// _js inside another's args is hashed before the outer one.
function parseNode({ node, jsMap, env }) {
  if (type.isArray(node)) {
    let parsed = node['~k'] ? node : copyNode(node);
    for (let index = 0; index < node.length; index += 1) {
      const item = parseNode({ node: node[index], jsMap, env });
      // Object.is: NaN is unchanged too.
      if (!Object.is(item, node[index])) {
        if (parsed === node) {
          parsed = copyNode(node);
        }
        parsed[index] = item;
      }
    }
    return parsed;
  }

  if (!type.isObject(node)) return node;

  let parsed = node['~k'] ? node : copyNode(node);
  let definedKeys = 0;
  for (const key of Object.keys(node)) {
    if (node[key] !== undefined) {
      definedKeys += 1;
    }
    const value = parseNode({ node: node[key], jsMap, env });
    if (!Object.is(value, node[key])) {
      if (parsed === node) {
        parsed = copyNode(node);
      }
      parsed[key] = value;
    }
  }

  // A key set to undefined is not written to the artifact, so it does not make
  // a _js operator something else, and _js set to undefined is no operator.
  if (definedKeys !== 1 || node._js === undefined) return parsed;
  return hashJsOperator({ operator: parsed, configKey: node['~k'], jsMap, env });
}

// Replaces the source of every _js operator in input with its hash, and adds
// the source to jsMap[env] under that hash. The result shares a node with
// input only where the node and everything under it has a ~k and holds no _js;
// every other node is a copy that keeps its ~r, ~k and ~l. So the caller owns
// input, and drops it or leaves the shared nodes unchanged.
function JsMapParser({ input, jsMap, env }) {
  if (!jsMap[env]) {
    jsMap[env] = {};
  }
  return parseNode({ node: input, jsMap, env });
}

export default JsMapParser;
