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

import { BuildError, LowdefyInternalError } from '@lowdefy/errors';

import serializeBuildException from './serializeBuildException.js';

function logCollectedErrors(context) {
  if (context.errors.length === 0) return;

  // handleError mutates each error in place (resolves source/config), so
  // capture the handled instance (not the original) for serialization below.
  const handledErrors = context.errors.map((err) => {
    const lowdefyErr = err.isLowdefyError
      ? err
      : new LowdefyInternalError(err.message, { cause: err });
    context.handleError(lowdefyErr);
    return lowdefyErr;
  });

  const buildError = new BuildError(
    `Build failed with ${context.errors.length} error(s). See above for details.`
  );
  buildError.errors = handledErrors.map(serializeBuildException);
  buildError.warnings = (context.warnings ?? []).map(serializeBuildException);
  throw buildError;
}

export default logCollectedErrors;
