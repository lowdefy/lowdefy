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

async function controlThrow(context, routineContext, { control }) {
  const { evaluateOperators } = context;
  const { items } = routineContext;
  const location = control['~k'] ?? ':throw';

  const message = evaluateOperators({
    input: control[':throw'],
    items,
    location,
    payload: routineContext.payload,
    state: routineContext.state,
    steps: routineContext.steps,
  });
  const cause = evaluateOperators({
    input: control[':cause'],
    items,
    location,
    payload: routineContext.payload,
    state: routineContext.state,
    steps: routineContext.steps,
  });
  const error = new UserError(message, { cause });

  // Log under `err` — the pino error serializer (createNodeLogger) is registered
  // for the `err` key only; an Error passed as `error` is JSON-dumped without its
  // non-enumerable `message`/`stack`, producing a log line with no message.
  context.logger.warn({
    event: 'warn_control_throw',
    err: error,
  });

  return {
    status: 'error',
    error,
  };
}
export default controlThrow;
