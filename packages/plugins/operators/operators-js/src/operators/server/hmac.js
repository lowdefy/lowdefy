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

import crypto from 'crypto';
import { type } from '@lowdefy/helpers';
import { runClass } from '@lowdefy/operators';

function createHmac(methodName) {
  return function hmac(key, data) {
    if (!type.isString(key)) {
      throw new Error(`_hmac.${methodName} requires "key" to be a string.`);
    }
    if (!type.isString(data)) {
      throw new Error(`_hmac.${methodName} requires "data" to be a string.`);
    }
    return crypto.createHmac(methodName, key).update(data, 'utf8').digest('hex');
  };
}

const functions = {
  sha256: createHmac('sha256'),
  sha512: createHmac('sha512'),
};

const meta = {
  sha256: { validTypes: ['object'], namedArgs: ['key', 'data'] },
  sha512: { validTypes: ['object'], namedArgs: ['key', 'data'] },
};

function _hmac({ params, location, methodName }) {
  return runClass({
    functions,
    location,
    meta,
    methodName,
    operator: '_hmac',
    params,
  });
}

_hmac.dynamic = false;

export default _hmac;
