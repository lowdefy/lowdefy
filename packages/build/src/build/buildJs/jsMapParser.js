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

import { serializer, type } from '@lowdefy/helpers';
import crypto from 'crypto';

function makeHash({ jsMap, env, value }) {
  const hash = crypto.createHash('sha1').update(value).digest('base64');
  jsMap[env][hash] = value;
  return { _js: hash };
}

function JsMapParser({ input, jsMap, env }) {
  if (!jsMap[env]) {
    jsMap[env] = {};
  }
  const reviver = (_, value) => {
    if (!type.isObject(value)) return value;
    if (Object.keys(value).length !== 1) return value;

    const key = Object.keys(value)[0];
    if (key !== '_js') return value;

    if (!type.isString(value[key])) {
      throw new Error('_js operator expects the JavaScript definition as a string.');
    }
    return makeHash({ jsMap, env, value: value[key] });
  };
  return serializer.copy(input, { reviver });
}

export default JsMapParser;
