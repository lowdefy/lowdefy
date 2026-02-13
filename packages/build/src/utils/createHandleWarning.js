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

import {
  ConfigWarning,
  errorToDisplayString,
  resolveErrorLocation,
  shouldSuppressBuildCheck,
} from '@lowdefy/errors/build';

import collectExceptions from './collectExceptions.js';

function createHandleWarning({ pinoLogger, context }) {
  return function handleWarning(params) {
    // Create warning
    const warning = new ConfigWarning({
      message: params.message,
      configKey: params.configKey,
      checkSlug: params.checkSlug,
    });
    if (params.received !== undefined) {
      warning.received = params.received;
    }

    // Suppression
    if (
      shouldSuppressBuildCheck({
        configKey: warning.configKey,
        keyMap: context.keyMap,
        checkSlug: warning.checkSlug,
      })
    ) {
      return;
    }

    // prodError escalation: collect ConfigWarning directly (it extends ConfigError)
    if (params.prodError && context.stage === 'prod') {
      collectExceptions(context, warning);
      return;
    }

    // Resolve location — pass params (has configKey, operatorLocation, filePath, lineNumber)
    resolveErrorLocation(params, {
      keyMap: context.keyMap,
      refMap: context.refMap,
      configDirectory: context.directories?.config,
    });
    if (params.source) warning.source = params.source;
    if (params.config) warning.config = params.config;
    if (params.link) warning.link = params.link;

    const source = warning.source ?? null;
    const dedupKey = source ?? warning.message;
    if (context.seenSourceLines?.has(dedupKey)) return;
    context.seenSourceLines?.add(dedupKey);

    pinoLogger.warn({ err: warning, source }, errorToDisplayString(warning));
  };
}

export default createHandleWarning;
