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

import { ConfigError, shouldSuppressBuildCheck } from '@lowdefy/errors/build';

/**
 * Wraps a build step to collect errors instead of stopping immediately.
 * Errors are collected in context.errors[], allowing the build to continue
 * and report all errors at once. Errors are logged together at checkpoints
 * in index.js to ensure proper ordering before the summary message.
 *
 * ConfigErrors suppressed via ~ignoreBuildChecks are ignored.
 *
 * @param {Function} stepFn - Build step function to execute
 * @param {string} stepName - Name of the build step (for debugging)
 * @param {Object} params - Parameters object
 * @param {Object} params.components - Build components
 * @param {Object} params.context - Build context with errors array
 * @returns {*} Result of the build step function
 */
function tryBuildStep(stepFn, stepName, { components, context }) {
  try {
    return stepFn({ components, context });
  } catch (error) {
    // Skip suppressed ConfigErrors (via ~ignoreBuildChecks)
    if (
      error instanceof ConfigError &&
      shouldSuppressBuildCheck({
        configKey: error.configKey,
        keyMap: context.keyMap,
        checkSlug: error.checkSlug,
      })
    ) {
      return;
    }
    // Collect error object - logging happens at checkpoints in index.js
    // ConfigError instances have source and message properties
    context.errors.push(error);
  }
}

export default tryBuildStep;
