/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { LowdefyError } from '@lowdefy/errors';
import { ConfigError } from '@lowdefy/errors/build';

function logCollectedErrors(context) {
  if (context.errors.length === 0) return;

  context.errors.forEach((err) => {
    if (err instanceof ConfigError || err.print) {
      context.logger.error(err);
    } else {
      const lowdefyErr = new LowdefyError(err.message, { cause: err });
      lowdefyErr.stack = err.stack;
      context.logger.error(lowdefyErr);
    }
  });
  const error = new Error(
    `Build failed with ${context.errors.length} error(s). See above for details.`
  );
  error.isFormatted = true;
  error.hideStack = true;
  throw error;
}

export default logCollectedErrors;
