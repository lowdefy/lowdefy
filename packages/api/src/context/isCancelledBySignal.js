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

// Whether an error is the request signal's abort coming back out of the work it cancelled.
// Clients raise it in their own shape: the MongoDB driver and fetch throw the signal's
// reason (an AbortError when the client left, a TimeoutError when the request timed out),
// other clients a plain AbortError, and axios a CanceledError. An unrelated failure raised
// after the signal aborted, such as a write that failed on its own, is still a fault.
function isCancelledBySignal({ error, signal }) {
  if (signal?.aborted !== true) return false;
  return (
    error === signal.reason ||
    error?.name === signal.reason?.name ||
    error?.name === 'AbortError' ||
    error?.name === 'CanceledError'
  );
}

export default isCancelledBySignal;
