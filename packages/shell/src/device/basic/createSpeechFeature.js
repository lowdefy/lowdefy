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

import * as Speech from 'expo-speech';

/**
 * The speech device feature (Speak, StopSpeaking): reads text aloud with the phone's voice. speak
 * resolves when the text is done, stopped or fails.
 */
function createSpeechFeature() {
  return {
    speak({ language, pitch, rate, text }) {
      return new Promise((resolve) => {
        Speech.speak(text, {
          language,
          pitch,
          rate,
          onDone: () => resolve({ done: true }),
          onStopped: () => resolve({ done: false }),
          onError: () => resolve({ done: false }),
        });
      });
    },
    async stop() {
      await Speech.stop();
    },
  };
}

export default createSpeechFeature;
