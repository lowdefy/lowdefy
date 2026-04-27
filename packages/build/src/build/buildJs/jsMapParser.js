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

import { ConfigError } from '@lowdefy/errors';
import { serializer, type } from '@lowdefy/helpers';
import crypto from 'crypto';

function hashFn({ jsMap, env, value }) {
  const hash = crypto.createHash('sha1').update(value).digest('base64');
  jsMap[env][hash] = value;
  return hash;
}

function JsMapParser({ input, jsMap, env }) {
  if (!jsMap[env]) {
    jsMap[env] = {};
  }
  const reviver = (_, value) => {
    if (!type.isObject(value)) return value;
    if (Object.keys(value).length !== 1) return value;

    const key = Object.keys(value)[0];

    if (key === '_jst') {
      const inner = value[key];
      if (!type.isString(inner)) {
        throw new ConfigError(
          `_jst operator expects a string template literal. Received ${JSON.stringify(inner)}.`,
          { configKey: value['~k'] }
        );
      }
      const body = `return \`${inner.replace(/`/g, '\\`')}\`;`;
      return { _jst: hashFn({ jsMap, env, value: body }) };
    }

    if (key !== '_js') return value;

    const inner = value[key];

    if (type.isString(inner)) {
      return { _js: hashFn({ jsMap, env, value: inner }) };
    }

    if (type.isObject(inner) && type.isString(inner.fn)) {
      return { _js: { fn: hashFn({ jsMap, env, value: inner.fn }), args: inner.args } };
    }

    throw new ConfigError(
      `_js operator expects a JavaScript string or { fn: string, args?: object }. Received ${JSON.stringify(inner)}.`,
      { configKey: value['~k'] }
    );
  };
  return serializer.copy(input, { reviver });
}

export default JsMapParser;
