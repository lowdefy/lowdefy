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

import createWireProjection from '../../../response/createWireProjection.js';
import evaluateRoutineOperators from '../evaluateRoutineOperators.js';

async function controlReject(context, routineContext, { control }) {
  const location = control['~k'] ?? ':reject';

  const message = evaluateRoutineOperators(context, routineContext, {
    input: control[':reject'],
    location,
  });
  const cause = evaluateRoutineOperators(context, routineContext, {
    input: control[':cause'],
    location,
  });
  // A reject is the author telling the user something, so it stays a UserError, whose message the
  // wire passes through as written. An Error given as the message is reduced to what the wire
  // would show for it - the author's text for a UserError, the generic message for a plugin error
  // - rather than stringified with its library text; `{ _error: message }` opts into the real text.
  const text = type.isError(message) ? createWireProjection(context)(message).message : message;
  const error = new UserError(text, { cause, isReject: true });

  // Log under `err` — see controlThrow: only the `err` key runs the pino error
  // serializer, so `error` would drop the message from the log line.
  context.logger.warn({
    event: 'warn_control_reject',
    err: error,
  });
  return {
    status: 'reject',
    error,
  };
}

export default controlReject;
