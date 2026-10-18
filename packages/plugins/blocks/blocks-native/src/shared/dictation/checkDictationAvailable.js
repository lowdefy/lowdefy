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

import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

import pickRecognitionLocale from './pickRecognitionLocale.js';

const UNAVAILABLE = { available: false, lang: null };

// Hermes reports the phone's own locale through Intl, so no native module is needed for it.
function getPhoneLocale() {
  return Intl.DateTimeFormat().resolvedOptions().locale;
}

async function getInstalledLocales() {
  try {
    const { installedLocales } = await ExpoSpeechRecognitionModule.getSupportedLocales({});
    return installedLocales;
  } catch (error) {
    // Android throws when the on-device recognition service is missing or fails to answer.
    return [];
  }
}

/**
 * Whether dictation can run on this phone, and in which locale. It needs a recogniser that runs
 * on the phone: speech is never sent to Apple's or Google's servers. iOS answers for the phone's
 * language directly. On Android the on-device service must also have a model for the phone's
 * language installed, else recognition would fail or need the network.
 *
 * @returns {Promise<{ available: boolean, lang: string|null }>}
 */
async function checkDictationAvailable() {
  if (
    !ExpoSpeechRecognitionModule.isRecognitionAvailable() ||
    !ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()
  ) {
    return UNAVAILABLE;
  }
  const phoneLocale = getPhoneLocale();
  if (Platform.OS !== 'android') {
    return { available: true, lang: phoneLocale };
  }
  const lang = pickRecognitionLocale({
    lang: phoneLocale,
    locales: await getInstalledLocales(),
  });
  if (lang === null) {
    return UNAVAILABLE;
  }
  return { available: true, lang };
}

export default checkDictationAvailable;
