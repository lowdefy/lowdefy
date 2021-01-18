/*
  Copyright 2020 Lowdefy, Inc

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

import commonOperators from './common';
import webOperators from './web';

class WebParser {
  constructor({ context, contexts }) {
    this.context = context;
    this.contexts = contexts;
    this.operations = {
      ...commonOperators,
      ...webOperators,
    };
  }

  parse({ input, args, location, arrayIndices }) {
    if (type.isUndefined(input)) {
      return { output: input, errors: [] };
    }
    if (args && !type.isObject(args)) {
      throw new Error('Operator parser args must be a object.');
    }
    if (location && !type.isString(location)) {
      throw new Error('Operator parser location must be a string.');
    }
    const errors = [];
    const reviver = (_, value) => {
      if (type.isObject(value) && Object.keys(value).length === 1) {
        const key = Object.keys(value)[0];
        const [op, methodName] = key.split('.');
        try {
          if (!type.isUndefined(this.operations[op])) {
            const res = this.operations[op]({
              actionLog: this.context.actionLog,
              args,
              arrayIndices,
              config: this.context.config,
              context: this.context,
              contexts: this.contexts,
              env: 'web',
              input: this.context.input,
              location: location ? applyArrayIndices(arrayIndices, location) : null,
              lowdefyGlobal: this.context.lowdefyGlobal,
              menus: this.context.menus,
              methodName,
              operations: this.operations,
              params: value[key],
              requests: this.context.requests,
              state: this.context.state,
              urlQuery: this.context.urlQuery,
            });
            return res;
          }
        } catch (e) {
          errors.push(e);
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
