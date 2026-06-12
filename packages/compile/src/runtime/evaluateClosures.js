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

import { type } from '@lowdefy/helpers';
import { ConfigError, OperatorError } from '@lowdefy/errors';

// The D4 closure error contract, bit-for-bit with the parsers: per-site
// operator errors are caught — ConfigErrors keep or gain the site's
// configKey; anything else wraps as OperatorError with the EVALUATED params
// as `received` (the reviver evaluates children first, and so do composed
// closures) — collected into the evaluation's errors array with null in
// place. An exception escaping an evaluation is by definition a compiler
// bug.
function evalOp(ctx, op, methodName, params, rawKey, configKey) {
  const siteConfigKey = configKey ?? undefined;
  try {
    return ctx.operators[op]({
      args: ctx.args,
      arrayIndices: [],
      env: ctx.env,
      i18n: ctx.i18n,
      items: ctx.items,
      jsMap: ctx.jsMap,
      location: ctx.location,
      lowdefyApp: ctx.lowdefyApp,
      methodName: methodName ?? undefined,
      operatorPrefix: ctx.operatorPrefix,
      operators: ctx.operators,
      params,
      parser: ctx.parser,
      payload: ctx.payload,
      runtime: 'node',
      secrets: ctx.secrets,
      state: ctx.state,
      steps: ctx.steps,
      user: ctx.user,
    });
  } catch (e) {
    if (e instanceof ConfigError) {
      if (!e.configKey) {
        e.configKey = siteConfigKey;
      }
      ctx.errors.push(e);
      return null;
    }
    const operatorError = new OperatorError(e.message, {
      cause: e,
      typeName: op,
      methodName: methodName ?? undefined,
      received: { [rawKey]: params },
      location: ctx.location,
      configKey: e.configKey ?? siteConfigKey,
    });
    ctx.errors.push(operatorError);
    return null;
  }
}

// Runs a compiled closure module with a parser-shaped environment and
// returns the parsers' { output, errors } contract. The input guards match
// ServerParser.parse exactly.
function evaluateClosures({
  closure,
  operators,
  operatorPrefix = '_',
  args,
  items,
  location,
  payload,
  state,
  steps,
  env,
  secrets,
  user,
  i18n,
  jsMap,
  lowdefyApp,
  parser,
}) {
  if (args && !type.isArray(args)) {
    throw new Error('Operator parser args must be an array.');
  }
  if (!type.isString(location)) {
    throw new Error('Operator parser location must be a string.');
  }
  const errors = [];
  const ctx = {
    evalOp,
    errors,
    operators,
    operatorPrefix,
    args,
    items,
    location,
    payload,
    state,
    steps,
    env,
    secrets,
    user,
    i18n,
    jsMap,
    lowdefyApp,
    // Operators that re-parse (callbacks, function builders) receive a real
    // parser here — injected by the caller (ServerParser on the server).
    parser,
  };
  return { output: closure(ctx), errors };
}

export { evaluateClosures, evalOp };
