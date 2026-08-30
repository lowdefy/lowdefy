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

import { ConfigError, ConfigWarning } from '@lowdefy/errors';
import { serializer, type } from '@lowdefy/helpers';
import crypto from 'crypto';

import collectExceptions from '../../utils/collectExceptions.js';
import { CLIENT_JS_PARAMS, SERVER_JS_PARAMS } from './jsFunctionPrototypes.js';
import { CLIENT_JS_GLOBALS, SERVER_JS_GLOBALS } from './jsGlobals.js';
import lintJsBody from './lintJsBodies.js';

const ENV_LINT_OPTIONS = {
  client: { params: CLIENT_JS_PARAMS, globals: CLIENT_JS_GLOBALS },
  server: { params: SERVER_JS_PARAMS, globals: SERVER_JS_GLOBALS },
};

// A body shared by many blocks is analysed once, but reported at every configKey.
const lintCache = new Map();

function analyseBody({ env, hash, body }) {
  const cacheKey = `${env}:${hash}`;
  if (!lintCache.has(cacheKey)) {
    lintCache.set(cacheKey, lintJsBody({ body, ...ENV_LINT_OPTIONS[env] }));
  }
  return lintCache.get(cacheKey);
}

function describeAvailableNames({ env, name }) {
  const available = `Available: ${ENV_LINT_OPTIONS[env].params.join(
    ', '
  )}, and the JavaScript standard library.`;
  if (env === 'server' && CLIENT_JS_GLOBALS.has(name)) {
    return `${available} This body runs on the server — browser globals such as "document" and "window" are not available.`;
  }
  return available;
}

function reportLint({ context, env, hash, body, configKey }) {
  const result = analyseBody({ env, hash, body });
  const meta = { configKey, checkSlug: 'js-lint' };
  if (result.syntaxError) {
    collectExceptions(
      context,
      new ConfigError(
        `_js body has a syntax error at line ${result.syntaxError.line}: ${result.syntaxError.message}.`,
        { ...meta, received: body }
      )
    );
    return;
  }
  result.undefinedNames.forEach(({ name, line }) => {
    collectExceptions(
      context,
      new ConfigError(
        `_js body references "${name}", which is not defined, at line ${line}. ${describeAvailableNames(
          { env, name }
        )}`,
        { ...meta, received: body }
      )
    );
  });
  result.unusedNames.forEach(({ name, line }) => {
    context.handleWarning(
      new ConfigWarning(`_js body declares "${name}" but never uses it, at line ${line}.`, meta)
    );
  });
}

function hashFn({ context, jsMap, env, value, configKey }) {
  const hash = crypto.createHash('sha1').update(value).digest('base64');
  jsMap[env][hash] = value;
  reportLint({ context, env, hash, body: value, configKey });
  return hash;
}

function JsMapParser({ input, jsMap, env, context }) {
  if (!jsMap[env]) {
    jsMap[env] = {};
  }
  const reviver = (_, value) => {
    if (!type.isObject(value)) return value;
    if (Object.keys(value).length !== 1) return value;

    const key = Object.keys(value)[0];
    if (key !== '_js') return value;

    const inner = value[key];

    if (type.isString(inner)) {
      return { _js: hashFn({ context, jsMap, env, value: inner, configKey: value['~k'] }) };
    }

    if (type.isObject(inner) && type.isString(inner.fn)) {
      return {
        _js: {
          fn: hashFn({ context, jsMap, env, value: inner.fn, configKey: value['~k'] }),
          args: inner.args,
        },
      };
    }

    throw new ConfigError(
      `_js operator expects a JavaScript string or { fn: string, args?: object }. Received ${JSON.stringify(
        inner
      )}.`,
      { configKey: value['~k'] }
    );
  };
  return serializer.copy(input, { reviver });
}

export default JsMapParser;
