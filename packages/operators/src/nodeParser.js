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

import { serializer, type } from '@lowdefy/helpers';

import commonOperators from './common/index.js';
import nodeOperators from './node/index.js';

class NodeParser {
  constructor({ payload, secrets, user } = {}) {
    this.payload = payload;
    this.secrets = secrets;
    this.user = user;
    this.parse = this.parse.bind(this);
    this.operators = {
      ...commonOperators,
      ...nodeOperators,
    };
    this.operations = {};
  }

  async init() {
    const operators = this.operators;
    const operations = this.operations;
    await Promise.all(
      Object.keys(operators).map(async (operator) => {
        const fn = await import(`./${operators[operator]}.js`);
        operations[operator] = fn.default;
        if (operations[operator].init) {
          await operations[operator].init();
        }
      })
    );
  }

  parse({ args, input, location }) {
    const operations = this.operations;
    const secrets = this.secrets;
    const payload = this.payload;
    const user = this.user;

    if (type.isUndefined(input)) {
      return { output: input, errors: [] };
    }
    if (args && !type.isArray(args)) {
      throw new Error('Operator parser args must be an array.');
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
          if (!type.isUndefined(operations[op])) {
            const res = operations[op]({
              args,
              arrayIndices: [],
              env: 'node',
              location,
              methodName,
              operations: operations,
              params: value[key],
              secrets,
              payload,
              user,
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

export default NodeParser;
