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

import { jest } from '@jest/globals';

// A stand-in for expo-speech-recognition, whose recogniser is a native module Jest does not have.
// A test sets what the phone supports and answers with setSpeechRecognition, then drives the
// session with emitSpeechEvent: results, volume, errors and the end. abort() ends the session at
// once, as the native module does: an "aborted" error, then the end.
const listeners = new Map();

function emitSpeechEvent(name, event = null) {
  [...(listeners.get(name) ?? [])].forEach((listener) => listener(event));
}

const ExpoSpeechRecognitionModule = {
  abort: jest.fn(() => {
    emitSpeechEvent('error', { error: 'aborted', message: 'Speech recognition aborted.' });
    emitSpeechEvent('end');
  }),
  addListener: jest.fn((name, listener) => {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(listener);
    return { remove: () => listeners.get(name).delete(listener) };
  }),
  getSupportedLocales: jest.fn(),
  isRecognitionAvailable: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  supportsOnDeviceRecognition: jest.fn(),
};

function setSpeechRecognition({
  available = true,
  granted = true,
  installedLocales = ['en-US'],
  onDevice = true,
} = {}) {
  ExpoSpeechRecognitionModule.isRecognitionAvailable.mockReturnValue(available);
  ExpoSpeechRecognitionModule.supportsOnDeviceRecognition.mockReturnValue(onDevice);
  ExpoSpeechRecognitionModule.requestPermissionsAsync.mockResolvedValue({
    granted,
    status: granted ? 'granted' : 'denied',
  });
  ExpoSpeechRecognitionModule.getSupportedLocales.mockResolvedValue({
    locales: installedLocales,
    installedLocales,
  });
}

function listenerCount(name) {
  return listeners.get(name)?.size ?? 0;
}

setSpeechRecognition();

export { emitSpeechEvent, ExpoSpeechRecognitionModule, listenerCount, setSpeechRecognition };
