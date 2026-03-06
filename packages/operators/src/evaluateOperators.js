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

import { ConfigError, OperatorError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

function setDynamicMarker(node) {
  if (type.isObject(node) || type.isArray(node)) {
    Object.defineProperty(node, '~dyn', { value: true, enumerable: false });
  }
  return node;
}

function hasDynChild(node) {
  if (type.isArray(node)) {
    return node.some((item) => {
      if (type.isArray(item) && item['~dyn'] === true) return true;
      if (type.isObject(item) && item['~dyn'] === true) return true;
      return false;
    });
  }
  if (type.isObject(node)) {
    return Object.values(node).some((item) => {
      if (type.isArray(item) && item['~dyn'] === true) return true;
      if (type.isObject(item) && item['~dyn'] === true) return true;
      return false;
    });
  }
  return false;
}

function hasDynamicMarker(value) {
  if ((type.isArray(value) || type.isObject(value)) && value['~dyn'] === true) return true;
  return hasDynChild(value);
}

function evaluateOperators({
  input,
  operators,
  operatorPrefix = '_',
  env,
  dynamicIdentifiers,
  typeNames,
  args,
}) {
  if (type.isUndefined(input)) {
    return { output: input, errors: [] };
  }
  if (args && !type.isArray(args)) {
    throw new Error('Operator parser args must be an array.');
  }

  const resolvedDynamicIdentifiers = dynamicIdentifiers ?? new Set();
  const resolvedTypeNames = typeNames ?? new Set();
  const errors = [];

  const parser = {
    parse: ({ args: callArgs, input: callInput, operatorPrefix: callPrefix }) =>
      evaluateOperators({
        input: callInput,
        operators,
        operatorPrefix: callPrefix ?? operatorPrefix,
        env,
        dynamicIdentifiers: resolvedDynamicIdentifiers,
        typeNames: resolvedTypeNames,
        args: callArgs,
      }),
  };

  function walk(node) {
    // Primitives pass through
    if (!type.isObject(node) && !type.isArray(node)) return node;

    // Arrays: walk children, then bubble up
    if (type.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        node[i] = walk(node[i]);
      }
      if (hasDynamicMarker(node)) {
        return setDynamicMarker(node);
      }
      return node;
    }

    // Object handling

    // ~shallow placeholders — mark as dynamic
    if (node['~shallow'] === true) {
      return setDynamicMarker(node);
    }

    // Walk children in-place (bottom-up)
    const keys = Object.keys(node);
    for (const k of keys) {
      node[k] = walk(node[k]);
    }

    // Operator detection (before type boundary and bubble-up, to match BuildParser order)
    const nonTildeKeys = keys.filter((k) => !k.startsWith('~'));
    const isSingleKeyObject = nonTildeKeys.length === 1;
    const key = isSingleKeyObject ? nonTildeKeys[0] : null;
    const isOperatorObject = key && key.startsWith(operatorPrefix);

    // Type boundary reset
    const isTypeBoundary = type.isString(node.type) && resolvedTypeNames.has(node.type);
    if (isTypeBoundary) {
      delete node['~dyn'];
    }

    // Bubble up ~dyn from children (but not at type boundaries).
    // _build.* operators always evaluate even with dynamic params, so skip bubble-up for them.
    const isBuildOperator = isOperatorObject && operatorPrefix === '_build.';
    if (!isTypeBoundary && !isBuildOperator && hasDynamicMarker(node)) {
      return setDynamicMarker(node);
    }

    // Skip non-operator objects with ~r marker
    if (type.isString(node['~r']) && !isOperatorObject) return node;

    if (!isSingleKeyObject) return node;
    if (!isOperatorObject) return node;

    const [op, methodName] = `_${key.substring(operatorPrefix.length)}`.split('.');

    // Dynamic identifier check — skip for _build.* operators
    const fullIdentifier = methodName ? `${op}.${methodName}` : op;
    if (operatorPrefix !== '_build.') {
      if (resolvedDynamicIdentifiers.has(fullIdentifier) || resolvedDynamicIdentifiers.has(op)) {
        return setDynamicMarker(node);
      }
    }

    // Unknown operator — mark as dynamic
    if (type.isUndefined(operators[op])) {
      return setDynamicMarker(node);
    }

    // Dynamic params check — skip for _build.* operators (they always evaluate)
    if (operatorPrefix !== '_build.') {
      if (hasDynamicMarker(node[key])) {
        return setDynamicMarker(node);
      }
    }

    const configKey = node['~k'];
    const lineNumber = node['~l'];
    const refId = node['~r'];
    const params = node[key];

    try {
      return operators[op]({
        args,
        arrayIndices: [],
        env,
        methodName,
        operators,
        params,
        operatorPrefix,
        parser,
        runtime: 'node',
      });
    } catch (e) {
      if (e instanceof ConfigError) {
        if (!e.configKey) {
          e.configKey = configKey;
        }
        if (!e.lineNumber) {
          e.lineNumber = lineNumber;
        }
        if (!e.refId) {
          e.refId = refId;
        }
        errors.push(e);
        return null;
      }
      const operatorError = new OperatorError(e.message, {
        cause: e,
        typeName: op,
        received: { [key]: params },
        configKey: e.configKey ?? configKey,
      });
      operatorError.lineNumber = lineNumber;
      operatorError.refId = refId;
      errors.push(operatorError);
      return null;
    }
  }

  const output = walk(input);
  return { output, errors };
}

export default evaluateOperators;
export { setDynamicMarker, hasDynamicMarker, hasDynChild };
