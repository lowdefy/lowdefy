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

import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

import createQueuedRecognizer from './createQueuedRecognizer.js';

// The stand-in Lowdefy Dev installs, so agents and journeys can dictate. A release shell never
// installs one, and dictation uses the phone's recogniser.
let installed = null;

/**
 * The recogniser dictation uses: the one Lowdefy Dev installed, or expo-speech-recognition's.
 */
function getRecognizer() {
  return installed ?? ExpoSpeechRecognitionModule;
}

/**
 * Makes dictation play injected transcripts, and use the microphone when none is injected
 * (createQueuedRecognizer). blocks-native cannot import the shell, so the shell's dev build passes
 * in its `injected`.
 *
 * @param {(name: string) => any} read Reads an injection: `transcript` and
 *   `permission:microphone`.
 * @returns {() => void} Removes it.
 */
function installDictationSource(read) {
  const recognizer = createQueuedRecognizer({ device: ExpoSpeechRecognitionModule, read });
  installed = recognizer;
  return () => {
    if (installed === recognizer) {
      installed = null;
    }
  };
}

export { installDictationSource };
export default getRecognizer;
