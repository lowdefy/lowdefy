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
import { type } from '@lowdefy/helpers';

// The closure twin of ServerParser.parse's reviver. The server parser has no
// arrayIndices, so the site location is the parse location verbatim.
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
      organization: ctx.organization,
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
    ctx.errors.push(
      new OperatorError(e.message, {
        cause: e,
        typeName: op,
        methodName: methodName ?? undefined,
        received: { [rawKey]: params },
        location: ctx.location,
        configKey: e.configKey ?? siteConfigKey,
      })
    );
    return null;
  }
}

function evaluateClosures({
  args,
  closure,
  items,
  location,
  operatorPrefix = '_',
  parser,
  payload,
  state,
  steps,
}) {
  if (!type.isFunction(closure)) {
    throw new Error(`Operator closure must be a function. Received ${JSON.stringify(closure)}.`);
  }
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
    args,
    env: parser.env,
    i18n: parser.i18n,
    items,
    jsMap: parser.jsMap,
    location,
    lowdefyApp: parser.lowdefyApp,
    operatorPrefix,
    operators: parser.operators,
    organization: parser.organization,
    // Operators that re-enter evaluation on a runtime-built subtree call
    // parser.parse; they stay on the walker by design (R23).
    parser,
    payload,
    secrets: parser.secrets,
    state,
    steps,
    user: parser.user,
  };
  return { output: closure(ctx), errors };
}

export default evaluateClosures;
export { evalOp };
