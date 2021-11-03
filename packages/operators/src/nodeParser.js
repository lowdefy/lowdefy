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

import commonOperators from './common';
import nodeOperators from './node';

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
    await Promise.all(
      Object.keys(this.operators).map(async (operator) => {
        const fn = await import(`./${this.operators[operator]}.js`);
        this.operations[operator] = fn.default;
        if (this.operations[operator].init) {
          await this.operations[operator].init();
        }
      })
    );
  }

  parse({ args, input, location }) {
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
          if (!type.isUndefined(this.operations[op])) {
            const res = this.operations[op]({
              args,
              arrayIndices: [],
              env: 'node',
              location,
              methodName,
              operations: this.operations,
              params: value[key],
              secrets: this.secrets,
              payload: this.payload,
              user: this.user,
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
