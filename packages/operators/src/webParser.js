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

import { applyArrayIndices, serializer, type } from '@lowdefy/helpers';

class WebParser {
  constructor({ context, operators }) {
    this.context = context;
    this.operators = operators;
    this.parse = this.parse.bind(this);
  }

  parse({ actions, args, arrayIndices, event, input, location, operatorPrefix = '_' }) {
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
    const { basePath, home, inputs, lowdefyGlobal, menus, pageId, user, _internal } =
      this.context._internal.lowdefy;
    const reviver = (_, value) => {
      if (!type.isObject(value)) return value;
      // TODO: pass ~k in errors.
      // const _k = value['~k'];
      delete value['~k'];

      if (Object.keys(value).length !== 1) return value;

      const key = Object.keys(value)[0];
      if (!key.startsWith(operatorPrefix)) return value;

      const [op, methodName] = `_${key.substring(operatorPrefix.length)}`.split('.');
      if (type.isUndefined(this.operators[op])) return value;

      try {
        const res = this.operators[op]({
          actions,
          args,
          arrayIndices,
          basePath,
          event,
          eventLog: this.context.eventLog,
          globals: _internal.globals,
          home,
          input: inputs[this.context.id],
          jsMap: this.context.jsMap,
          location: applyArrayIndices(arrayIndices, location),
          lowdefyGlobal,
          menus,
          methodName,
          operatorPrefix,
          operators: this.operators,
          pageId,
          params: value[key],
          parser: this,
          requests: this.context.requests,
          runtime: 'browser',
          state: this.context.state,
          user,
        });
        return res;
      } catch (e) {
        errors.push(e);
        console.error(e);
        return null;
      }
    };
    return {
      output: serializer.copy(input, { reviver }),
      errors,
    };
  }
}

export default WebParser;
