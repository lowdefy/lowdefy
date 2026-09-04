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
import { type } from '@lowdefy/helpers';

import collectExceptions from '../utils/collectExceptions.js';
import {
  CLIENT_JS_PARAMS,
  SERVER_JS_PARAMS,
  parameterEnvironment,
} from '../build/buildJs/jsFunctionPrototypes.js';
import { CLIENT_JS_GLOBALS, SERVER_JS_GLOBALS } from '../build/buildJs/jsGlobals.js';
import lintJsBody from '../build/buildJs/lintJsBodies.js';

const ENV_LINT_OPTIONS = {
  client: { params: CLIENT_JS_PARAMS, globals: CLIENT_JS_GLOBALS },
  server: { params: SERVER_JS_PARAMS, globals: SERVER_JS_GLOBALS },
};

// A body shared by many blocks is analysed once, but reported at every
// configKey. The cache is per-build state, so it hangs off the context: a
// module-level map would grow for the life of a dev session and leak results
// between builds.
function analyseBody({ context, env, hash, body }) {
  if (type.isNone(context.jsLintCache)) {
    context.jsLintCache = new Map();
  }
  const cacheKey = `${env}:${hash}`;
  if (!context.jsLintCache.has(cacheKey)) {
    context.jsLintCache.set(cacheKey, lintJsBody({ body, ...ENV_LINT_OPTIONS[env] }));
  }
  return context.jsLintCache.get(cacheKey);
}

function describeAvailableNames({ env, name }) {
  const available = `Available: ${ENV_LINT_OPTIONS[env].params.join(
    ', '
  )}, and the JavaScript standard library.`;
  const provider = parameterEnvironment(name);
  if (!type.isNone(provider)) {
    return `"${name}" is a ${provider} _js parameter, and this body runs on the ${env}. ${available}`;
  }
  if (env === 'server' && CLIENT_JS_GLOBALS.has(name)) {
    return `${available} This body runs on the server — browser globals such as "document" and "window" are not available.`;
  }
  return available;
}

function reportLint({ context, env, hash, body, configKey }) {
  const result = analyseBody({ context, env, hash, body });
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

// jsMapParser queues every _js body it hashes on context.jsBodies; this rule
// drains the queue so each body is reported once per pipeline run (full build,
// shallow dev build, or a JIT page build). A JIT page build passes its own list
// so two concurrent builds cannot drain each other's queued bodies.
function run({ context, jsBodies = context.jsBodies }) {
  const entries = jsBodies.splice(0, jsBodies.length);
  entries.forEach((entry) => reportLint({ context, ...entry }));
}

const jsLint = {
  slug: 'js-lint',
  checkOnly: false,
  run,
};

export default jsLint;
