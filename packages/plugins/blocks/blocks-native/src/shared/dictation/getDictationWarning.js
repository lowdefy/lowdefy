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

// Errors that end a session without anything going wrong for the person: they cancelled
// ("aborted", which iOS sends on abort()), or they said nothing ("no-speech", and Android's
// "speech-timeout" for the same case).
const QUIET = new Set(['aborted', 'no-speech', 'speech-timeout']);

/**
 * The warning a speech recognition error shows: `denied` when the microphone or speech permission
 * is refused, nothing for a session the person ended or left silent, and `failed` for anything
 * else.
 *
 * @param {Object} params
 * @param {string} params.error The error code of expo-speech-recognition's error event.
 * @returns {'denied'|'failed'|null}
 */
function getDictationWarning({ error }) {
  if (error === 'not-allowed') {
    return 'denied';
  }
  if (QUIET.has(error)) {
    return null;
  }
  return 'failed';
}

export default getDictationWarning;
