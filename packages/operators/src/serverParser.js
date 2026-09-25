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

import findOperatorInData from './findOperatorInData.js';
import isCheckedContentRead from './isCheckedContentRead.js';
import isLiteralPassThrough from './isLiteralPassThrough.js';

class ServerParser {
  constructor({ env, i18n, jsMap, lowdefyApp, operators, organization, secrets, user }) {
    this.env = env;
    this.i18n = i18n;
    this.jsMap = jsMap;
    this.lowdefyApp = lowdefyApp;
    this.operators = operators;
    this.organization = organization;
    this.parse = this.parse.bind(this);
    this.secrets = secrets;
    this.user = user;
  }

  parse({
    args,
    arrayIndices = [],
    error,
    input,
    items,
    literalData = null,
    location,
    operatorPrefix = '_',
    payload,
    state,
    steps,
  }) {
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
    // Operators that evaluate nested config (_function) re-enter the parser. Binding the frame here
    // means they only pass what they change, so no frame field can be dropped on the way in.
    const parser = {
      parse: (callOptions) =>
        this.parse({
          arrayIndices,
          error,
          items,
          literalData,
          location,
          payload,
          state,
          steps,
          ...callOptions,
        }),
    };
    const reviver = (_, value) => {
      if (!type.isObject(value)) return value;
      if (Object.keys(value).length !== 1) return value;

      const key = Object.keys(value)[0];
      if (!key.startsWith(operatorPrefix)) return value;

      const [op, methodName] = `_${key.substring(operatorPrefix.length)}`.split('.');
      if (type.isUndefined(this.operators[op])) return value;
      const configKey = value['~k'];
      const params = value[key];
      try {
        const res = this.operators[op]({
          args,
          arrayIndices,
          env: this.env,
          error,
          i18n: this.i18n,
          items,
          jsMap: this.jsMap,
          location,
          lowdefyApp: this.lowdefyApp,
          methodName,
          operatorPrefix,
          operators: this.operators,
          organization: this.organization,
          params,
          parser,
          payload,
          runtime: 'node',
          secrets: this.secrets,
          state,
          steps,
          user: this.user,
        });
        // Under literalData the output is sent to a client that evaluates every
        // operator-shaped object, so no operator result may carry one unless
        // the operator only passes through params the reviver already checked.
        if (
          literalData !== null &&
          !isLiteralPassThrough({ op, methodName }) &&
          !isCheckedContentRead({ literalData, op, params })
        ) {
          const found = findOperatorInData(res);
          if (found) {
            const operatorName = methodName ? `${op}.${methodName}` : op;
            throw new ConfigError(
              `Data returned by "${operatorName}" contains the operator "${found.operator}"${
                found.path ? ` at "${found.path}"` : ''
              }. Operators in endpoint data do not run in Dynamic block content. Write client operators in the endpoint's :return config instead.`
            );
          }
        }
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
          methodName,
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
