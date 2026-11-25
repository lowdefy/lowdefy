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

// The error that stops work the request no longer waits for: the client closed the
// connection, or the server's request timeout answered first (the signal's reason says
// which). A cancellation is the caller's doing, not a fault in the app, so it is a
// UserError: never sent to error tracking. It is logged once at debug where the work
// stopped, and marked handled so no routine around it logs it again.
// fields name the step it stopped in (endpointId, stepId, connectionId), when there is one.
function createCancellationError({ cause, fields = {}, logger, signal }) {
  const error = new UserError(signal.reason.message, { cause });
  Object.assign(error, fields);
  logger.debug({ event: 'debug_request_cancelled', err: error }, error.message);
  error.handled = true;
  return error;
}

export default createCancellationError;
