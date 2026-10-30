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

import { HTTPException } from 'hono/http-exception';
import { timeout } from 'hono/timeout';

// Caps how long a request may run, and cancels the work it leaves behind. The 504 is
// answered while the handler is still running; the TimeoutError on the request's
// timeout signal (which apiContext folds into context.signal) cancels the upstream
// calls the handler is waiting on, such as an AI provider call, instead of letting
// them run, and bill, after the response has gone.
//
// The 504 has no body. The handler runs on after the 504 is sent, on the same context:
// a header set on it then, by the middleware around the handler or by the handler
// itself (c.redirect sets one), makes hono rebuild the sent 504 from its body. Sending
// it has already read that body, so the rebuild throws. A response with no body
// rebuilds safely. The client reads any 504 as a timeout.
function requestTimeout({ timeoutMs }) {
  return function requestTimeoutMiddleware(c, next) {
    const controller = new AbortController();
    c.set('requestTimeoutSignal', controller.signal);
    return timeout(timeoutMs, () => {
      controller.abort(
        new DOMException(`The request timeout of ${timeoutMs}ms was exceeded.`, 'TimeoutError')
      );
      return new HTTPException(504, { res: new Response(null, { status: 504 }) });
    })(c, next);
  };
}

export default requestTimeout;
