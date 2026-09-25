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

import { UserError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import evaluateRoutineOperators from '../evaluateRoutineOperators.js';

async function controlThrow(context, routineContext, { control }) {
  const location = control['~k'] ?? ':throw';

  const message = evaluateRoutineOperators(context, routineContext, {
    input: control[':throw'],
    location,
  });
  // An Error, such as a rethrown `_error`, goes on unchanged. Wrapped in a UserError it would be
  // stringified into the message, which the wire sends as author text; under its own class the
  // wire makes it generic unless it was a UserError. It carries its own cause, so :cause is unused.
  let error = message;
  if (!type.isError(message)) {
    const cause = evaluateRoutineOperators(context, routineContext, {
      input: control[':cause'],
      location,
    });
    error = new UserError(message, { cause });
  }

  // Log under `err` — the pino error serializer (createNodeLogger) is registered
  // for the `err` key only; an Error passed as `error` is JSON-dumped without its
  // non-enumerable `message`/`stack`, producing a log line with no message.
  context.logger.error({
    event: 'error_control_throw',
    err: error,
  });

  return {
    status: 'error',
    error,
  };
}
export default controlThrow;
