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

// A stand-in for a native module Jest has no native side for (expo-haptics, expo-location,
// expo-maps, react-native-nfc-manager, ...): every export is a function that resolves to
// undefined, so the shell's device features can be built in tests. Tests that exercise a feature
// install their own fakes in the device registry.
function stub() {
  return Promise.resolve(undefined);
}

module.exports = new Proxy(
  {},
  {
    get(target, key) {
      if (key === '__esModule') return true;
      return stub;
    },
  }
);
