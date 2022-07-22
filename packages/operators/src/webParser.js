/*
  Copyright 2020-2022 Lowdefy, Inc

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

class WebParser {
  constructor({ context, operators }) {
    this.context = context;
    this.operators = operators;
    this.parse = this.parse.bind(this);
  }

  parse({ actions, args, arrayIndices, event, input, operatorPrefix = '_' }) {
    if (type.isUndefined(input)) {
      return input;
    }
    if (event && !type.isObject(event)) {
      throw new Error('Operator parser event must be a object.', {
        cause: {
          _k_: input?._k_,
        },
      });
    }
    if (args && !type.isArray(args)) {
      throw new Error('Operator parser args must be an array.', {
        cause: {
          _k_: input?._k_,
        },
      });
    }
    const { basePath, home, inputs, lowdefyGlobal, menus, pageId, user, _internal } =
      this.context._internal.lowdefy;
    const reviver = (_, value) => {
      if (!type.isObject(value)) return value;
      const _k_ = value._k_;
      delete value._k_;

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
          lowdefyGlobal: lowdefyGlobal,
          menus: menus,
          methodName,
          operatorPrefix,
          operators: this.operators,
          pageId,
          params: value[key],
          parser: this,
          requests: this.context.requests,
          state: this.context.state,
          user: user,
        });
        return res;
      } catch (error) {
        const origionalCause = type.isObject(error.cause) ? error.cause : { cause: error.cause };
        error.cause = {
          _k_,
          ...origionalCause, // maintain the deepest possible _k_
          kind: 'operator',
          type: op,
        };
        throw error;
      }
    };
    return serializer.copy(input, { reviver });
  }
}

export default WebParser;
