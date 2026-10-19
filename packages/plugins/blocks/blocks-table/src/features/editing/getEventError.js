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

const FALLBACK_MESSAGE = 'The change was not saved.';

// The failure message of a `triggerEvent` result, or null when the event succeeded. A failed
// action chain resolves (it does not reject) with `success: false` and `error` holding the thrown
// `{ error, action, index }`; the message the user should see is that inner error's. A bounced
// (debounced) event is not a failure: a later trigger carries the change.
function getEventError(result) {
  if (result?.success !== false) return null;
  return result.error?.error?.message ?? result.error?.message ?? FALLBACK_MESSAGE;
}

export default getEventError;
