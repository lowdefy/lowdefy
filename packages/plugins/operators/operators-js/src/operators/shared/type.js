/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { get, type } from '@lowdefy/helpers';

function _type({ location, params, state }) {
  const typeName = type.isObject(params) ? params.type : params;
  if (!type.isString(typeName)) {
    throw new Error(
      `Operator Error: _type.type must be a string. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }

  const on = Object.prototype.hasOwnProperty.call(params, 'on')
    ? params.on
    : get(state, get(params, 'key', { default: location }));

  switch (typeName) {
    case 'string':
      return type.isString(on);
    case 'array':
      return type.isArray(on);
    case 'date':
      return type.isDate(on); // Testing for date is problematic due to stringify
    case 'object':
      return type.isObject(on);
    case 'boolean':
      return type.isBoolean(on);
    case 'number':
      return type.isNumber(on);
    case 'integer':
      return type.isInt(on);
    case 'null':
      return type.isNull(on);
    case 'undefined':
      return type.isUndefined(on);
    case 'none':
      return type.isNone(on);
    case 'primitive':
      return type.isPrimitive(on);
    default:
      throw new Error(
        `Operator Error: "${typeName}" is not a valid _type test. Received: ${JSON.stringify(
          params
        )} at ${location}.`
      );
  }
}

export default _type;
