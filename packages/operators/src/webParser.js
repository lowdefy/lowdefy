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

import commonOperators from './common/index.js';
import webOperators from './web/index.js';

class WebParser {
  constructor({ context }) {
    this.context = context;
    this.init = this.init.bind(this);
    this.parse = this.parse.bind(this);
    this.operators = {
      ...commonOperators,
      ...webOperators,
    };
    this.operations = {};
  }

  async init() {
    if (!type.isObject(this.context._internal.lowdefy)) {
      throw new Error('context._internal.lowdefy must be an object.');
    }
    if (!type.isArray(this.context._internal.operators)) {
      throw new Error('context._internal.operators must be an array.');
    }
    const operators = this.operators;
    const operations = this.operations;
    await Promise.all(
      this.context._internal.operators.map(async (operator) => {
        if (operators[operator]) {
          const fn = await import(`./${operators[operator]}.js`);
          operations[operator] = fn.default;
          if (operations[operator].init) {
            await operations[operator].init();
          }
        }
      })
    );
  }

  parse({ actions, args, arrayIndices, event, input, location }) {
    const operations = this.operations;
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
    if (location && !type.isString(location)) {
      throw new Error('Operator parser location must be a string.');
    }
    const errors = [];
    const { inputs, lowdefyGlobal, menus, urlQuery, user } = context._internal.lowdefy;
    const reviver = (_, value) => {
      if (type.isObject(value) && Object.keys(value).length === 1) {
        const key = Object.keys(value)[0];
        const [op, methodName] = key.split('.');
        try {
          if (!type.isUndefined(operations[op])) {
            const res = operations[op]({
              eventLog: context.eventLog,
              actions,
              args,
              arrayIndices,
              context: context,
              env: 'web',
              event,
              input: inputs ? inputs[context.id] : {},
              location: location ? applyArrayIndices(arrayIndices, location) : null,
              lowdefyGlobal: lowdefyGlobal || {},
              menus: menus || {},
              methodName,
              operations: operations,
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
