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

import { shouldSuppressBuildCheck } from '@lowdefy/errors/build';

/**
 * Collects an exception (ConfigError or ConfigWarning) instead of throwing immediately.
 * Allows the build to continue and collect all exceptions before stopping.
 *
 * @param {Object} context - Build context
 * @param {ConfigError|ConfigWarning} exception - Exception instance (already created with all properties)
 */
function collectExceptions(context, exception) {
  // Skip suppressed exceptions (from ~ignoreBuildChecks)
  if (
    shouldSuppressBuildCheck({
      configKey: exception.configKey,
      keyMap: context.keyMap,
      checkSlug: exception.checkSlug,
    })
  ) {
    return;
  }

  if (!context.errors) {
    // If no error collection array, throw immediately (fallback for tests)
    throw exception;
  }

  // Collect exception object - logging happens at checkpoints in index.js
  context.errors.push(exception);
}

export default collectExceptions;
