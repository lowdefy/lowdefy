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

import { ServiceError } from '@lowdefy/errors';

// A routine runs for as long as its steps take, and a `:while` has no
// iteration cap - an author's runaway loop would otherwise hold a worker on a
// shared server forever, with nothing able to stop it. context.signal is the
// incoming request's AbortSignal (the servers' apiContext middleware sets it),
// so a caller that disconnects or a platform that times the invocation out
// stops the routine at the next step or loop iteration. Work that outlives its
// request - a background, detached, scheduled or webhook run - has no signal:
// there is nothing there to describe it (detachRequestSignal).
//
// This is a cancellation, not a config fault: nothing the author writes can
// prevent it, so it is a ServiceError with the transport's own abort code.
function checkAborted(context, { location }) {
  if (context.signal?.aborted !== true) return;
  throw new ServiceError(
    `The request was aborted before ${location} ran. The caller disconnected or the platform timed the invocation out, so the routine was stopped.`,
    { code: 'ECONNABORTED', statusCode: 499 }
  );
}

export default checkAborted;
