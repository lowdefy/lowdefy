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

// Stop between phases once the caller has aborted. Each phase — evaluating the
// page, walking it to IR, laying out the document — is a chunk of CPU work that
// nobody is waiting for any more.
function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw signal.reason ?? new ReportTimeoutError('Report generation was aborted.');
  }
}

export default throwIfAborted;
