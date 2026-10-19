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

// An error no build step collected stops the build. It is logged with its
// location, and the thrown BuildError carries its message, location and stack
// as `errors`, the same field a collected-errors BuildError carries, so a caller
// that only sees the thrown error (the dev server's build status) can show what
// failed. The walker records the file it was resolving on the error as
// filePath, which the wrapper keeps so the location resolves.
function createInternalBuildError({ error, context, logger }) {
  let lowdefyErr = error;
  if (!error.isLowdefyError) {
    lowdefyErr = new LowdefyInternalError(error.message, { cause: error });
    lowdefyErr.filePath = error.filePath;
  }
  if (context) {
    context.handleError(lowdefyErr);
  } else {
    logger.error(lowdefyErr);
  }
  const buildError = new BuildError('Build failed due to internal error. See above for details.');
  buildError.errors = [{ ...serializeBuildException(lowdefyErr), stack: error.stack ?? null }];
  buildError.warnings = (context?.warnings ?? []).map(serializeBuildException);
  return buildError;
}

export default createInternalBuildError;
