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

import loadPonyfill from './loadPonyfill.js';
import toDetectorFormats from './toDetectorFormats.js';

// The browser's own BarcodeDetector (Chrome on Android, macOS and ChromeOS), else the zxing
// ponyfill. With no types set, the browser's detector reads the default types it supports, so
// the default never downloads the ponyfill where the browser has a detector (macOS lacks codabar
// and upc_a). With types set, it is used only when it reads all of them. A detector that supports
// none of them (an Android phone without Google Play services) counts as none.
async function createDetector({ types, nativeDetector = globalThis.BarcodeDetector }) {
  const formats = toDetectorFormats({ types });
  if (nativeDetector) {
    const supported = await nativeDetector.getSupportedFormats();
    const nativeFormats = formats.filter((format) => supported.includes(format));
    if (type.isNone(types) && nativeFormats.length > 0) {
      return new nativeDetector({ formats: nativeFormats });
    }
    if (!type.isNone(types) && formats.every((format) => supported.includes(format))) {
      return new nativeDetector({ formats });
    }
  }
  const PonyfillDetector = await loadPonyfill();
  return new PonyfillDetector({ formats });
}

export default createDetector;
