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

const MAX_HINTS = 100;

/**
 * The options a dictation session starts expo-speech-recognition with: words as they are heard,
 * until stopped, recognised on the phone only (never on Apple's or Google's servers), punctuated,
 * as text entry, in the phone's language, with the host's hints (such as the names that can be
 * mentioned) and the input level.
 *
 * @param {Object} params
 * @param {string[]} [params.hints] Words the recogniser should expect; the first 100 are used.
 * @param {string} params.lang The recognition locale.
 * @returns {Object}
 */
function getStartOptions({ hints, lang }) {
  const contextualStrings = (hints ?? [])
    .filter((hint) => type.isString(hint) && hint !== '')
    .slice(0, MAX_HINTS);
  return {
    lang,
    interimResults: true,
    continuous: true,
    requiresOnDeviceRecognition: true,
    addsPunctuation: true,
    iosTaskHint: 'dictation',
    contextualStrings,
    volumeChangeEventOptions: { enabled: true },
  };
}

export default getStartOptions;
