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

import { applyArrayIndices } from '@lowdefy/helpers';
import { ConfigError, OperatorError } from '@lowdefy/errors';

// S3c: the WebParser twin of the compiled-closure evaluation (D4 contract).
// Compiled page modules embed closures at the engine's parse roots; each
// operator site calls ctx.evalOp — errors are caught per site, ConfigErrors
// keep or gain the site's configKey, anything else wraps as OperatorError
// with the EVALUATED params as `received` and the arrayIndices-applied
// location, collected with null in place — reproducing WebParser.parse
// bit-for-bit.
function evalOp(ctx, op, methodName, params, rawKey, configKey) {
  const siteConfigKey = configKey ?? undefined;
  const operatorLocation = applyArrayIndices(ctx.arrayIndices, ctx.location);
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
      location: operatorLocation,
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
        location: operatorLocation,
        configKey: e.configKey ?? siteConfigKey,
      })
    );
    return null;
  }
}

// Runs a compiled closure with the parser's own environment — called from
// WebParser.parse when the input is a function, so the engine's parse sites
// need no changes and data inputs keep the reviver tree-walk.
function evaluateWebClosures({ parser, closure, actions, args, arrayIndices, event, location }) {
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
    operatorPrefix: '_',
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
    input: inputs?.[parser.context.id],
    jsMap: parser.context.jsMap,
    location,
    lowdefyApp,
    lowdefyGlobal,
    menus,
    pageId,
    parser,
    requests: parser.context.requests,
    state: parser.context.state,
    theme,
    user,
  };
  return { output: closure(ctx), errors };
}

export { evaluateWebClosures, evalOp };
