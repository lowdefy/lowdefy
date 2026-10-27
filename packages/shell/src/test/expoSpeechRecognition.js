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

// A stand-in for expo-speech-recognition, whose recogniser is a native module Jest does not have.
// The native blocks' dictation hook asks it whether the phone can recognise speech; here it
// cannot, so screens render without a mic. blocks-native's own tests drive a fuller stand-in.
const ExpoSpeechRecognitionModule = {
  abort: () => {},
  addListener: () => ({ remove: () => {} }),
  getSupportedLocales: async () => ({ locales: [], installedLocales: [] }),
  isRecognitionAvailable: () => false,
  requestPermissionsAsync: async () => ({ granted: false, status: 'denied' }),
  start: () => {},
  stop: () => {},
  supportsOnDeviceRecognition: () => false,
};

export { ExpoSpeechRecognitionModule };
