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

import { ReservedKeyError, get, type } from '@lowdefy/helpers';

function _type({ location, params, state }) {
  const typeName = type.isObject(params) ? params.type : params;
  if (!type.isString(typeName)) {
    throw new Error(`_type.type must be a string.`);
  }

  let on;
  if (Object.prototype.hasOwnProperty.call(params, 'on')) {
    on = params.on;
  } else {
    try {
      on = get(state, get(params, 'key', { default: location }));
    } catch (error) {
      // A runtime read: the key comes from app data or an author keypath evaluated at render time,
      // and there is no config location to attach in the browser. The reserved rule's job — refusing
      // the read — is already done, so degrade to the miss value rather than crashing the page.
      if (!(error instanceof ReservedKeyError)) throw error;
    }
  }

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
    // `empty` is what a form author means by "no value" - null, undefined, '' and [];
    // 0, false and {} are values.
    case 'empty':
      return type.isNone(on) || on === '' || (type.isArray(on) && on.length === 0);
    case 'primitive':
      return type.isPrimitive(on);
    default:
      throw new Error(`"${typeName}" is not a valid _type test.`);
  }
}

_type.dynamic = true;

export default _type;
