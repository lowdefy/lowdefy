/*
  Copyright 2020-2024 Lowdefy, Inc

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

  constructor({
    env,
    payload,
    secrets,
    user,
    operators,
    verbose,
    dynamicIdentifiers,
    typeNames,
  }) {
    this.env = env;
    this.operators = operators;
    this.parse = this.parse.bind(this);
    this.payload = payload;
    this.secrets = secrets;
    this.user = user;
    this.verbose = verbose;
    this.dynamicIdentifiers = dynamicIdentifiers ?? new Set();
    this.typeNames = typeNames ?? new Set();
  }

  // TODO: Look at logging here
  // TODO: Remove console.error = () => {}; from tests
  parse({ args, input, location, operatorPrefix = '_' }) {
    if (type.isUndefined(input)) {
      return { output: input, errors: [] };
    }
    if (args && !type.isArray(args)) {
      throw new Error('Operator parser args must be an array.');
    }
    if (!type.isString(location)) {
      throw new Error('Operator parser location must be a string.');
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
      // TODO: pass ~r in errors. Build does not have ~k.
      if (type.isString(value['~r'])) return value;

      // Type boundary reset: if object has a 'type' key matching a registered type,
      // delete the ~dyn marker and skip bubble-up to prevent propagation past this boundary
      const isTypeBoundary = type.isString(value.type) && this.typeNames.has(value.type);
      if (isTypeBoundary) {
        delete value['~dyn'];
      }

      // Check if params contain dynamic content (bubble up), but not at type boundaries
      if (!isTypeBoundary && BuildParser.hasDynamicMarker(value)) {
        return BuildParser.setDynamicMarker(value);
      }

      if (Object.keys(value).length !== 1) return value;
      const key = Object.keys(value)[0];
      if (!key.startsWith(operatorPrefix)) return value;
      const [op, methodName] = `_${key.substring(operatorPrefix.length)}`.split('.');

      // Check if this operator/method is dynamic
      const fullIdentifier = methodName ? `${op}.${methodName}` : op;
      if (this.dynamicIdentifiers.has(fullIdentifier) || this.dynamicIdentifiers.has(op)) {
        return BuildParser.setDynamicMarker(value);
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

      // Build location with line number if available
      const lineNumber = value['~l'];
      const operatorLocation = lineNumber ? `${location}:${lineNumber}` : location;

      try {
        const res = this.operators[op]({
          args,
          arrayIndices: [],
          env: this.env,
          location: operatorLocation,
          methodName,
          operators: this.operators,
          params: value[key],
          operatorPrefix,
          parser: this,
          payload: this.payload,
          runtime: 'node',
          secrets: this.secrets,
          user: this.user,
        });
        return res;
      } catch (e) {
        // Attach location info for error formatting
        e.operatorLocation = {
          line: value['~l'],
          ref: value['~r'],
        };
        errors.push(e);
        if (this.verbose) {
          console.error(e);
        }
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
