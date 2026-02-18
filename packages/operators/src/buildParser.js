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
import { serializer, type } from '@lowdefy/helpers';

class BuildParser {
  // Check if value or its immediate children have the dynamic marker
  // Note: Only checks immediate children because bubble-up happens bottom-up in reviver
  static hasDynamicMarker(value) {
    if (type.isArray(value) && value['~dyn'] === true) return true;
    if (type.isObject(value) && value['~dyn'] === true) return true;
    if (type.isArray(value)) {
      return value.some((item) => {
        if (type.isArray(item) && item['~dyn'] === true) return true;
        if (type.isObject(item) && item['~dyn'] === true) return true;
        return false;
      });
    }
    if (type.isObject(value)) {
      return Object.values(value).some((item) => {
        if (type.isArray(item) && item['~dyn'] === true) return true;
        if (type.isObject(item) && item['~dyn'] === true) return true;
        return false;
      });
    }
    return false;
  }

  // Set dynamic marker as non-enumerable property
  static setDynamicMarker(value) {
    if (type.isObject(value) || type.isArray(value)) {
      Object.defineProperty(value, '~dyn', { value: true, enumerable: false });
    }
    return value;
  }

  constructor({ env, payload, secrets, user, operators, dynamicIdentifiers, typeNames }) {
    this.env = env;
    this.operators = operators;
    this.parse = this.parse.bind(this);
    this.payload = payload;
    this.secrets = secrets;
    this.user = user;
    this.dynamicIdentifiers = dynamicIdentifiers ?? new Set();
    this.typeNames = typeNames ?? new Set();
  }

  parse({ args, input, operatorPrefix = '_' }) {
    if (type.isUndefined(input)) {
      return { output: input, errors: [] };
    }
    if (args && !type.isArray(args)) {
      throw new Error('Operator parser args must be an array.');
    }
    const errors = [];
    const reviver = (_, value) => {
      // Handle arrays: bubble up dynamic marker if any element is dynamic
      if (type.isArray(value)) {
        if (BuildParser.hasDynamicMarker(value)) {
          return BuildParser.setDynamicMarker(value);
        }
        return value;
      }

      if (!type.isObject(value)) return value;

      // Check if this is an operator object BEFORE checking ~r
      // Operators in vars have ~r set by copyVarValue (as enumerable), but should still be evaluated
      // Filter out ~ prefixed keys (like ~r, ~k, ~l) when determining if single-key operator
      const keys = Object.keys(value);
      const nonTildeKeys = keys.filter((k) => !k.startsWith('~'));
      const isSingleKeyObject = nonTildeKeys.length === 1;
      const key = isSingleKeyObject ? nonTildeKeys[0] : null;
      const isOperatorObject = key && key.startsWith(operatorPrefix);

      // Type boundary reset: if object has a 'type' key matching a registered type,
      // delete the ~dyn marker and skip bubble-up to prevent propagation past this boundary
      const isTypeBoundary = type.isString(value.type) && this.typeNames.has(value.type);
      if (isTypeBoundary) {
        delete value['~dyn'];
      }

      // Check if params contain dynamic content (bubble up), but not at type boundaries
      // This must happen BEFORE the ~r check to allow dynamic markers to propagate
      if (!isTypeBoundary && BuildParser.hasDynamicMarker(value)) {
        return BuildParser.setDynamicMarker(value);
      }

      // Skip non-operator objects that have already been processed (have ~r marker)
      // But allow operator objects to be evaluated even if they have ~r
      if (type.isString(value['~r']) && !isOperatorObject) return value;

      if (!isSingleKeyObject) return value;
      if (!isOperatorObject) return value;

      const [op, methodName] = `_${key.substring(operatorPrefix.length)}`.split('.');

      // Check if this operator/method is dynamic
      // Skip this check for _build.* operators (operatorPrefix === '_build.') because
      // build operators should ALWAYS be evaluated at build time
      const fullIdentifier = methodName ? `${op}.${methodName}` : op;
      if (operatorPrefix !== '_build.') {
        if (this.dynamicIdentifiers.has(fullIdentifier) || this.dynamicIdentifiers.has(op)) {
          return BuildParser.setDynamicMarker(value);
        }
      }

      // If operator is not in our operators map, it's a runtime-only operator
      // Mark it as dynamic to preserve it for runtime evaluation
      if (type.isUndefined(this.operators[op])) {
        return BuildParser.setDynamicMarker(value);
      }

      // Check if params contain dynamic content before evaluating
      if (BuildParser.hasDynamicMarker(value[key])) {
        return BuildParser.setDynamicMarker(value);
      }

      const configKey = value['~k'];
      const lineNumber = value['~l'];
      const refId = value['~r'];
      const params = value[key];

      try {
        const res = this.operators[op]({
          args,
          arrayIndices: [],
          env: this.env,
          methodName,
          operators: this.operators,
          params,
          operatorPrefix,
          parser: this,
          payload: this.payload,
          runtime: 'node',
          secrets: this.secrets,
          user: this.user,
        });
        return res;
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
        // lineNumber and refId needed by buildRefs consumers (evaluateBuildOperators,
        // evaluateStaticOperators) which run before addKeys — no configKey
        // exists yet, so they use filePath + lineNumber for resolution.
        // refId (from ~r) identifies the source file in the refMap.
        operatorError.lineNumber = lineNumber;
        operatorError.refId = refId;
        errors.push(operatorError);
        return null;
      }
    };
    return {
      output: serializer.copy(input, { reviver }),
      errors,
    };
  }
}

export default BuildParser;
