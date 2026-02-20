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
import { serializer, type } from '@lowdefy/helpers';

class ServerParser {
  constructor({ env, jsMap, operators, payload, secrets, state, steps, user }) {
    this.env = env;
    this.jsMap = jsMap;
    this.operators = operators;
    this.parse = this.parse.bind(this);
    this.payload = payload;
    this.secrets = secrets;
    this.state = state;
    this.steps = steps;
    this.user = user;
  }

  parse({ args, input, items, location, operatorPrefix = '_' }) {
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
      if (!type.isObject(value)) return value;
      const configKey = value['~k'];
      delete value['~k'];
      if (Object.keys(value).length !== 1) return value;

      const key = Object.keys(value)[0];
      if (!key.startsWith(operatorPrefix)) return value;

      const [op, methodName] = `_${key.substring(operatorPrefix.length)}`.split('.');
      if (type.isUndefined(this.operators[op])) return value;
      const params = value[key];
      try {
        const res = this.operators[op]({
          args,
          arrayIndices: [],
          env: this.env,
          items,
          jsMap: this.jsMap,
          location,
          methodName,
          operatorPrefix,
          operators: this.operators,
          params,
          parser: this,
          payload: this.payload,
          runtime: 'node',
          secrets: this.secrets,
          state: this.state,
          steps: this.steps,
          user: this.user,
        });
        return res;
      } catch (e) {
        if (e instanceof ConfigError) {
          if (!e.configKey) {
            e.configKey = configKey;
          }
          errors.push(e);
          return null;
        }
        const operatorError = new OperatorError(e.message, {
          cause: e,
          typeName: op,
          received: { [key]: params },
          location,
          configKey: e.configKey ?? configKey,
        });
        errors.push(operatorError);
        return null;
      }
    };
    return {
      output: serializer.copy(input, { reviver }),
      errors,
    };
  }
}

export default ServerParser;
