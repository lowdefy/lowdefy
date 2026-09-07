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

import { ReportTimeoutError } from '../errors.js';

// Race a generation against a timer, and abort it when the timer wins. The abort
// is what makes the timeout mean anything: a report holds an engine context, a
// rendered document and its buffers, so a run that keeps going after its caller
// has been answered is pure leaked memory. The signal reaches every place a
// generation can outlive its deadline: the queue wait, every wait in the
// evaluation (an init action or the drain awaiting a request that never
// settles is the usual wedge), and the phase boundaries of the pipeline.
function withTimeout(promise, { timeoutMs, pageId, controller }) {
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => {
      const error = new ReportTimeoutError(
        `Report generation for page '${pageId}' timed out after ${timeoutMs}ms. ` +
          'A request that never settles during the drain is the usual cause.'
      );
      // Abort with the same error the caller sees, so whatever the generation
      // rejects with downstream carries the same cause.
      controller.abort(error);
      reject(error);
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export default withTimeout;
