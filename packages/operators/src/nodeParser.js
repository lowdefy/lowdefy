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

class NodeParser {
  constructor({ env, payload, secrets, user, operators }) {
    this.env = env;
    this.operators = operators;
    this.payload = payload;
    this.secrets = secrets;
    this.user = user;
    this.parse = this.parse.bind(this);
  }

  async init() {
    await Promise.all(
      Object.values(this.operators).map(async (operator) => {
        if (operator.init) {
          await operator.init();
        }
      })
    );
  }

  parse({ args, input, location, operatorPrefix = '_' }) {
    const env = this.env;
    const operators = this.operators;
    const secrets = this.secrets;
    const payload = this.payload;
    const user = this.user;

    if (type.isUndefined(input)) {
      return { output: input, errors: [] };
    }
    if (args && !type.isArray(args)) {
      throw new Error('Operator parser args must be an array.');
    }
    if (!type.isString(location)) {
      throw new Error('Operator parser location must be a string.');
    }
    const errors = [];
    const reviver = (_, value) => {
      if (!type.isObject(value) || Object.keys(value).length !== 1) return value;

      const key = Object.keys(value)[0];
      if (!key.startsWith(operatorPrefix)) return value;

      const [op, methodName] = `_${key.substring(operatorPrefix.length)}`.split('.');
      if (type.isUndefined(operators[op])) return value;
      try {
        const res = operators[op]({
          args,
          arrayIndices: [],
          env,
          location,
          methodName,
          operators: operators,
          params: value[key],
          operatorPrefix,
          parser: this,
          payload,
          secrets,
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

export default NodeParser;
