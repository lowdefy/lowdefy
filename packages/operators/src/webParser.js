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

import commonOperators from './common';
import webOperators from './web';

class WebParser {
  constructor({ context, contexts }) {
    this.context = context;
    this.contexts = contexts;
    this.init = this.init.bind(this);
    this.parse = this.parse.bind(this);
    this.operators = {
      ...commonOperators,
      ...webOperators,
    };
    this.operations = {};
  }

  async init() {
    if (!type.isObject(this.context.lowdefy)) {
      throw new Error('context.lowdefy must be an object.');
    }
    if (!type.isArray(this.context.operators)) {
      throw new Error('context.operators must be an array.');
    }
    await Promise.all(
      this.context.operators.map(async (operator) => {
        if (this.operators[operator]) {
          const fn = await import(`./${this.operators[operator]}.js`);
          this.operations[operator] = fn.default;
          if (this.operations[operator].init) {
            await this.operations[operator].init();
          }
        }
      })
    );
  }

  parse({ args, arrayIndices, event, input, location }) {
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
    const { inputs, lowdefyGlobal, menus, urlQuery, user } = this.context.lowdefy;
    const reviver = (_, value) => {
      if (type.isObject(value) && Object.keys(value).length === 1) {
        const key = Object.keys(value)[0];
        const [op, methodName] = key.split('.');
        try {
          if (!type.isUndefined(this.operations[op])) {
            const res = this.operations[op]({
              eventLog: this.context.eventLog,
              args,
              arrayIndices,
              context: this.context,
              contexts: this.contexts,
              env: 'web',
              event,
              input: inputs ? inputs[this.context.id] : {},
              location: location ? applyArrayIndices(arrayIndices, location) : null,
              lowdefyGlobal: lowdefyGlobal || {},
              menus: menus || {},
              methodName,
              operations: this.operations,
              params: value[key],
              requests: this.context.requests,
              state: this.context.state,
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
