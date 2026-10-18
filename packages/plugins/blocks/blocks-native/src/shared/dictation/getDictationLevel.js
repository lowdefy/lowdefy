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

// expo-speech-recognition's volumechange value runs from -2 to 10, and anything below 0 is
// inaudible.
const LOUDEST = 10;

/**
 * The input level the meter shows, from 0 (silent) to 1 (loud), for a volumechange value.
 *
 * @param {Object} params
 * @param {number} params.value The volumechange event's value.
 * @returns {number}
 */
function getDictationLevel({ value }) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.min(value / LOUDEST, 1);
}

export default getDictationLevel;
