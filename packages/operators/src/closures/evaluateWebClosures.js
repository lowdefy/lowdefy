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
import { applyArrayIndices, type } from '@lowdefy/helpers';

// The closure twin of WebParser.parse's reviver. Every emitted operator site
// calls evalOp, so the error contract is reproduced here rather than inherited:
// a ConfigError keeps or gains the site's configKey, anything else wraps as an
// OperatorError carrying the EVALUATED params as `received` and the
// arrayIndices-applied location, and the site yields null while the error is
// collected. An exception escaping evaluateWebClosures is a compiler bug.
function evalOp(ctx, op, methodName, params, rawKey, configKey) {
  const siteConfigKey = configKey ?? undefined;
  try {
    return ctx.operators[op]({
      actions: ctx.actions,
      args: ctx.args,
      arrayIndices: ctx.arrayIndices,
      apiResponses: ctx.apiResponses,
      basePath: ctx.basePath,
      event: ctx.event,
      eventLog: ctx.eventLog,
      globals: ctx.globals,
      home: ctx.home,
      i18n: ctx.i18n,
      input: ctx.input,
      jsMap: ctx.jsMap,
      location: ctx.operatorLocation,
      lowdefyApp: ctx.lowdefyApp,
      lowdefyGlobal: ctx.lowdefyGlobal,
      menus: ctx.menus,
      methodName: methodName ?? undefined,
      operatorPrefix: ctx.operatorPrefix,
      operators: ctx.operators,
      pageId: ctx.pageId,
      params,
      parser: ctx.parser,
      requests: ctx.requests,
      runtime: 'browser',
      state: ctx.state,
      theme: ctx.theme,
      user: ctx.user,
      websockets: ctx.websockets,
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
        location: ctx.operatorLocation,
        configKey: e.configKey ?? siteConfigKey,
      })
    );
    return null;
  }
}

// `arrayIndices` are runtime state, not emission state: one emitted closure is
// shared by every item of a list block and receives the indices per evaluation.
function evaluateWebClosures({
  actions,
  args,
  arrayIndices,
  closure,
  event,
  location,
  operatorPrefix = '_',
  parser,
}) {
  if (!type.isFunction(closure)) {
    throw new Error(`Operator closure must be a function. Received ${JSON.stringify(closure)}.`);
  }
  if (event && !type.isObject(event)) {
    throw new Error('Operator parser event must be a object.');
  }
  if (args && !type.isArray(args)) {
    throw new Error('Operator parser args must be an array.');
  }
  if (!type.isString(location)) {
    throw new Error('Operator parser location must be a string.');
  }
  const {
    apiResponses,
    basePath,
    home,
    i18n,
    inputs,
    lowdefyApp,
    lowdefyGlobal,
    menus,
    pageId,
    theme,
    user,
    _internal,
  } = parser.context._internal.lowdefy;
  const errors = [];
  const ctx = {
    evalOp,
    errors,
    operators: parser.operators,
    operatorPrefix,
    operatorLocation: applyArrayIndices(arrayIndices, location),
    actions,
    args,
    arrayIndices,
    apiResponses,
    basePath,
    event,
    eventLog: parser.context.eventLog,
    globals: _internal.globals,
    home,
    i18n,
    input: inputs[parser.context.id],
    jsMap: parser.context.jsMap,
    location,
    lowdefyApp,
    lowdefyGlobal,
    menus,
    pageId,
    // Operators that re-enter evaluation on a subtree they build at runtime
    // (_js, _nunjucks, _function, the _array callbacks) call parser.parse; they
    // stay on the walker by design (R23).
    parser,
    requests: parser.context.requests,
    state: parser.context.state,
    theme,
    user,
    websockets: parser.context.websockets,
  };
  return { output: closure(ctx), errors };
}

export default evaluateWebClosures;
export { evalOp };
