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

import { type } from '@lowdefy/helpers';

// The signal the work a request starts is cancelled with (context.signal). Request
// resolvers hand it to the calls they make upstream, so a request nobody is waiting
// for any more stops those calls instead of letting them run, and bill, to the end.
//
// It aborts with an AbortError when the client closes the connection before the
// response is sent (clientSignal, the incoming request's own signal), and with the
// timeout signal's TimeoutError when the server's request timeout answers first.
// callRequestResolver reads the reason: an AbortError means the caller left, which
// is not a fault. The Node adapter aborts the incoming request's signal with a plain
// string, which clients such as the AI SDK do not recognise as a cancellation, so the
// client's abort is re-raised as a DOMException.
function createRequestSignal({ clientSignal, timeoutSignal }) {
  const clientClosed = new AbortController();
  function onClientClose() {
    clientClosed.abort(
      new DOMException(
        'The client closed the connection before the response was sent.',
        'AbortError'
      )
    );
  }
  if (clientSignal.aborted) {
    onClientClose();
  } else {
    clientSignal.addEventListener('abort', onClientClose, { once: true });
  }
  if (type.isNone(timeoutSignal)) {
    return clientClosed.signal;
  }
  return AbortSignal.any([clientClosed.signal, timeoutSignal]);
}

export default createRequestSignal;
