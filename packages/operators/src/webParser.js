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
import { applyArrayIndices, serializer, type } from '@lowdefy/helpers';

import compileParseTree from './compileParseTree.js';

// The serializer's reviver converts these after the custom reviver has run, so
// an operator result carrying them is converted too.
function reviveOperatorResult(result) {
  if (!type.isObject(result)) {
    return result;
  }
  if (!type.isUndefined(result['~e'])) {
    return serializer.deserialize({ '~e': result['~e'] });
  }
  if (!type.isUndefined(result['~d'])) {
    const date = new Date(result['~d']);
    return type.isDate(date) ? date : result;
  }
  return result;
}

class WebParser {
  // A config tree is compiled on its compileThreshold-th parse. Block roots are
  // parsed on every evaluation pass, so they compile on the second; one-off
  // inputs (a _function call's fresh copy) never pay the compile cost.
  static compileThreshold = 2;

  constructor({ context, operators }) {
    this.context = context;
    this.operators = operators;
    this.parse = this.parse.bind(this);
    // operatorPrefix -> WeakMap(input -> { count, tree })
    this.compiled = new Map();
  }

  getCompiledTree({ input, operatorPrefix }) {
    if (!this.compiled.has(operatorPrefix)) {
      this.compiled.set(operatorPrefix, new WeakMap());
    }
    const entries = this.compiled.get(operatorPrefix);
    let entry = entries.get(input);
    if (!entry) {
      entry = { count: 0, tree: undefined };
      entries.set(input, entry);
    }
    if (entry.tree === undefined) {
      entry.count += 1;
      if (entry.count < WebParser.compileThreshold) {
        return null;
      }
      entry.tree = compileParseTree(input);
    }
    return entry.tree;
  }

  parse({ actions, args, arrayIndices, error, event, input, location, operatorPrefix = '_' }) {
    if (type.isUndefined(input)) {
      return { output: input, errors: [] };
    }
    if (event && !type.isObject(event)) {
      throw new Error('Operator parser event must be a object.');
    }
    if (args && !type.isArray(args)) {
      throw new Error('Operator parser args must be an array.');
    }
    if (!type.isString(location)) {
      throw new Error('Operator parser location must be a string.');
    }
    const errors = [];
    // Operators that evaluate nested config (_function) re-enter the parser. Binding the frame here
    // means they only pass what they change, so no frame field can be dropped on the way in.
    const parser = {
      parse: (callOptions) =>
        this.parse({ actions, arrayIndices, error, event, location, ...callOptions }),
    };
    const {
      apiResponses,
      basePath,
      home,
      i18n,
      inputs,
      lowdefyApp,
      lowdefyGlobal,
      menus,
      pageId,
      theme,
      user,
      _internal,
    } = this.context._internal.lowdefy;
    // The operator test and call for a single-key object, shared by the walker's
    // reviver and compiled trees so both evaluate identically.
    const reviveKey = (value, key) => {
      if (!key.startsWith(operatorPrefix)) return value;

      const [op, methodName] = `_${key.substring(operatorPrefix.length)}`.split('.');
      if (type.isUndefined(this.operators[op])) return value;

      const configKey = value['~k'];
      const params = value[key];
      const operatorLocation = applyArrayIndices(arrayIndices, location);
      try {
        const res = this.operators[op]({
          actions,
          args,
          arrayIndices,
          apiResponses,
          basePath,
          error,
          event,
          eventLog: this.context.eventLog,
          globals: _internal.globals,
          home,
          i18n,
          input: inputs[this.context.id],
          jsMap: this.context.jsMap,
          location: operatorLocation,
          lowdefyApp,
          lowdefyGlobal,
          menus,
          methodName,
          operatorPrefix,
          operators: this.operators,
          pageId,
          params,
          parser,
          requests: this.context.requests,
          runtime: 'browser',
          state: this.context.state,
          theme,
          user,
          websockets: this.context.websockets,
        });
        return res;
      } catch (e) {
        // ConfigError from plugin - add configKey and re-throw structure
        if (e instanceof ConfigError) {
          if (!e.configKey) {
            e.configKey = configKey;
          }
          errors.push(e);
          return null;
        }
        // Plain error from plugin - wrap in OperatorError
        errors.push(
          new OperatorError(e.message, {
            cause: e,
            typeName: op,
            methodName,
            received: { [key]: params },
            location: operatorLocation,
            configKey: e.configKey ?? configKey,
          })
        );
        return null;
      }
    };
    const revive = (value) => {
      if (!type.isObject(value)) return value;

      if (Object.keys(value).length !== 1) return value;

      return reviveKey(value, Object.keys(value)[0]);
    };
    // A JSON round trip returns these unchanged (-0 becomes 0), and the
    // reviver returns a non-object as-is: visible, required and loading are
    // usually one of these.
    if (input === null || type.isString(input) || type.isBoolean(input) || type.isNumber(input)) {
      return { output: input === 0 ? 0 : input, errors };
    }
    if (type.isObject(input) || type.isArray(input) || type.isDate(input)) {
      const tree = this.getCompiledTree({ input, operatorPrefix });
      if (tree) {
        return {
          output: tree({
            reviveKey: (value, key) => {
              const result = reviveKey(value, key);
              return result === value ? value : reviveOperatorResult(result);
            },
          }),
          errors,
        };
      }
    }
    return {
      output: serializer.copy(input, { reviver: (_, value) => revive(value) }),
      errors,
    };
  }
}

export default WebParser;
