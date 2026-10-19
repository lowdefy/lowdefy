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

// The injector Lowdefy Dev installs (src/dev/inject). A release shell never installs one.
let injector = null;

/**
 * The next device result Lowdefy Dev was told to fake, or undefined when there is none: in a
 * release shell always. A device action reads it first, in one line, and uses the device only when
 * nothing was injected:
 *
 *   const scan = injected('scan');
 *   if (scan !== undefined) return scan;
 *
 * Names:
 * - `scan`: the next ScanCode or QRScanner read, `{ data, type }`.
 * - `photo`: the next TakePhoto or PickImage result, `{ base64, mimeType, width, height }`.
 * - `nfc`: the next ReadNfc read.
 * - `transcript`: what the next dictation session hears, `{ partials?, final }` or `{ error }`.
 *   Dictation (blocks-native) reads it through the source Lowdefy Dev installs with
 *   installDictationSource.
 * - `location`: the location GeolocationCurrentPosition and geofences read,
 *   `{ latitude, longitude, accuracy, ... }`.
 * - `permission:<name>`: the answer to the next request for a permission, 'granted' or 'denied'
 *   (`permission:microphone` for dictation).
 *
 * @param {string} name
 */
function injected(name) {
  if (injector === null) {
    return undefined;
  }
  return injector.take(name);
}

// Installs the injector `injected` reads (`{ take(name) }`); returns the function that removes it.
function installInjector(next) {
  injector = next;
  return () => {
    if (injector === next) {
      injector = null;
    }
  };
}

export { installInjector };
export default injected;
