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

import loadPonyfill from './loadPonyfill.js';

// The browser's own BarcodeDetector when it reads every requested format (Chrome on Android,
// macOS and ChromeOS), else the zxing ponyfill. macOS lacks codabar and upc_a, so asking for
// either there takes the ponyfill.
async function createDetector({ formats, nativeDetector = globalThis.BarcodeDetector }) {
  if (nativeDetector) {
    const supported = await nativeDetector.getSupportedFormats();
    if (formats.every((format) => supported.includes(format))) {
      return new nativeDetector({ formats });
    }
  }
  const PonyfillDetector = await loadPonyfill();
  return new PonyfillDetector({ formats });
}

export default createDetector;
