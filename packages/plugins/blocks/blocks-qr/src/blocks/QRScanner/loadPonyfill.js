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

let ponyfill = null;

async function load() {
  const [{ BarcodeDetector, prepareZXingModule, purgeZXingModule }, { default: wasmUrl }] =
    await Promise.all([
      import('barcode-detector/ponyfill'),
      import('zxing-wasm/reader/zxing_reader.wasm?url'),
    ]);
  try {
    // fireImmediately fetches and compiles the .wasm now, while the camera opens, instead of on
    // the first detect().
    await prepareZXingModule({
      overrides: {
        locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasmUrl : prefix + path),
      },
      fireImmediately: true,
    });
  } catch (error) {
    // zxing keeps the module promise, rejected or not, and hands it to every later caller, so a
    // failed .wasm fetch or compile would fail every start until the page reloads.
    purgeZXingModule();
    throw error;
  }
  return BarcodeDetector;
}

// Loads the zxing BarcodeDetector for browsers without a native one (iOS, Firefox, Windows and
// Linux). It is imported only then, so other browsers never download it. The ponyfill fetches
// its .wasm from jsDelivr by default; locateFile points it at the copy this package ships, which
// the app's Vite build serves from its own origin. zxing-wasm is pinned to the version
// barcode-detector bundles the loader of (checked by wasmVersion.test.js).
async function loadPonyfill() {
  if (ponyfill === null) {
    ponyfill = load();
    // A failed download (offline, a new deploy that removed the old chunk or .wasm) must not
    // stick: the next start tries again.
    ponyfill.catch(() => {
      ponyfill = null;
    });
  }
  return ponyfill;
}

export default loadPonyfill;
