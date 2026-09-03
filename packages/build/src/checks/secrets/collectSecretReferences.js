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

import traverseConfig from '../../utils/traverseConfig.js';

// `_secret` is a server operator, so it survives the build as a literal
// { _secret: params } node and the built config is a complete inventory of
// every place the app reads a secret.
function operatorKey(node) {
  const keys = Object.keys(node).filter((key) => !key.startsWith('~'));
  if (keys.length !== 1) return undefined;
  return keys[0];
}

function isOperatorObject(value) {
  return type.isObject(value) && Object.keys(value).some((key) => key.startsWith('_'));
}

// Resolves one `_secret` node to the name it reads, or marks it dynamic.
// `{ name }` is a literal to check, `{ dynamic: true }` is a name only the
// runtime knows, and `{}` is a form this rule does not own: `all`, a malformed
// params (the operator itself errors on those), or an explicit `default`, which
// says the author meant the secret to be optional.
function readReference(params) {
  if (type.isString(params) || type.isInt(params)) return { name: String(params) };
  if (!type.isObject(params)) return {};
  if (isOperatorObject(params)) return { dynamic: true };
  if (params.all === true) return {};
  if (!type.isUndefined(params.default)) return {};
  if (isOperatorObject(params.key)) return { dynamic: true };
  if (!type.isString(params.key) && !type.isInt(params.key)) return {};
  return { name: String(params.key) };
}

function collectSecretReferences({ components }) {
  const references = [];
  let dynamic = 0;
  traverseConfig({
    config: components,
    visitor: (node) => {
      if (operatorKey(node) !== '_secret') return;
      const reference = readReference(node._secret);
      if (reference.dynamic === true) {
        dynamic += 1;
        return;
      }
      if (type.isUndefined(reference.name)) return;
      references.push({ name: reference.name, configKey: node['~k'] });
    },
  });
  return { dynamic, references };
}

export default collectSecretReferences;
