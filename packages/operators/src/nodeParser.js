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
  constructor({ build, env, payload, secrets, user, operators }) {
    this.build = build;
    this.env = env;
    this.operators = operators;
    this.parse = this.parse.bind(this);
    this.payload = payload;
    this.secrets = secrets;
    this.user = user;
  }

  parse({ args, input, operatorPrefix = '_' }) {
    if (type.isUndefined(input)) {
      return input;
    }
    if (args && !type.isArray(args)) {
      throw new Error('Operator parser args must be an array.', {
        cause: {
          _k_: input?._k_,
        },
      });
    }
    const reviver = (_, value) => {
      if (!type.isObject(value)) return value;
      const { _k_, ...object } = value;
      if (Object.keys(object).length !== 1) return this.build ? value : object;
      const key = Object.keys(object).filter((key) => key !== '_k_')[0];
      if (!key.startsWith(operatorPrefix)) return this.build ? value : object;

      const [op, methodName] = `_${key.substring(operatorPrefix.length)}`.split('.');
      if (type.isUndefined(this.operators[op])) return this.build ? value : object;
      try {
        const res = this.operators[op]({
          args,
          arrayIndices: [],
          env: this.env,
          methodName,
          operators: this.operators,
          params: object[key],
          operatorPrefix,
          parser: this,
          payload: this.payload,
          secrets: this.secrets,
          user: this.user,
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

export default NodeParser;
