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

import { resolveErrorLocation, shouldSuppressBuildCheck } from '@lowdefy/errors';

import collectExceptions from './collectExceptions.js';

function createHandleWarning({ context }) {
  // The warnings this handler listed. A dev page build gets its own handler and
  // list, while seenSourceLines is shared by every page build on the context:
  // each page lists its own warnings, and the terminal shows each one once.
  const listedKeys = new Set();
  return function handleWarning(warning) {
    if (shouldSuppressBuildCheck(warning, context.keyMap)) {
      return;
    }

    if (warning.prodError && context.stage === 'prod') {
      collectExceptions(context, warning);
      return;
    }

    const location = resolveErrorLocation(warning, {
      keyMap: context.keyMap,
      refMap: context.refMap,
      configDirectory: context.directories?.config,
    });
    if (location) {
      warning.source = location.source;
      warning.config = location.config;
    }

    const dedupKey = warning.dedupKey ?? warning.source ?? warning.message;
    if (context.seenSourceLines) {
      if (listedKeys.has(dedupKey)) return;
      listedKeys.add(dedupKey);
    }

    if (context.warnings) {
      context.warnings.push(warning);
    }
    if (context.seenSourceLines?.has(dedupKey)) return;
    context.seenSourceLines?.add(dedupKey);
    context.logger.warn(warning);
  };
}

export default createHandleWarning;
