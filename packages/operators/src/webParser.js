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

class WebParser {
  constructor({ context, operators }) {
    this.context = context;
    this.operators = operators;
    this.parse = this.parse.bind(this);
  }

  // `kind` is measurement-only: it labels the caller's expression (visible,
  // properties, a validation test) so the engine's perf counters can report
  // parses by kind. It never affects evaluation.
  parse({ actions, args, arrayIndices, event, input, kind, location, operatorPrefix = '_' }) {
    const perf = this.context._internal?.perf;
    if (perf) perf.countParse(kind ?? 'other');
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
    let nodes = 0;
    const reviver = (_, value) => {
      if (perf) nodes += 1;
      if (!type.isObject(value)) return value;

      if (Object.keys(value).length !== 1) return value;

      const key = Object.keys(value)[0];
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
          parser: this,
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
    if (!perf) {
      return {
        output: serializer.copy(input, { reviver }),
        errors,
      };
    }
    const start = performance.now();
    const output = serializer.copy(input, { reviver });
    perf.countCopy({ location, ms: performance.now() - start, nodes });
    return { output, errors };
  }
}

export default WebParser;
