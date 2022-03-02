/*
  Copyright 2020-2021 Lowdefy, Inc

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
    this.parse = this.parse.bind(this);
    this.operators = operators;
  }

  parse({ actions, args, arrayIndices, event, input, location }) {
    const operators = this.operators;
    const context = this.context;

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
    const { inputs, lowdefyGlobal, menus, urlQuery, user } = context._internal.lowdefy;
    const reviver = (_, value) => {
      if (type.isObject(value) && Object.keys(value).length === 1) {
        const key = Object.keys(value)[0];
        const [op, methodName] = key.split('.');
        try {
          if (!type.isUndefined(operators[op])) {
            const res = operators[op]({
              eventLog: context.eventLog,
              actions,
              args,
              arrayIndices,
              context: context,
              env: 'web',
              event,
              input: inputs ? inputs[context.id] : {},
              location: applyArrayIndices(arrayIndices, location),
              lowdefyGlobal: lowdefyGlobal || {},
              menus: menus || {},
              methodName,
              operators: operators,
              params: value[key],
              requests: context.requests,
              state: context.state,
              urlQuery: urlQuery || {},
              user: user || {},
              parser: this,
            });
            return res;
          }
        } catch (e) {
          errors.push(e);
          console.error(e);
          return null;
        }
      }
      return value;
    };
    return {
      output: serializer.copy(input, { reviver }),
      errors,
    };
  }
}

export default WebParser;
