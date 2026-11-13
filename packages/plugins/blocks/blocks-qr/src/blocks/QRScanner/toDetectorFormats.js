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

import typeFormats from './typeFormats.js';

// Only zxing reads these, so no browser's own detector does: asking for one always takes the
// ponyfill. The default leaves them out, which is also the native QRScanner's list of types.
const zxingOnlyTypes = new Set(['databar', 'databar_expanded', 'maxicode']);

// The BarcodeDetector formats to ask for: one per code type, and with no types set, every type
// but the zxing-only ones.
function toDetectorFormats({ types }) {
  const requested =
    types ?? Object.keys(typeFormats).filter((codeType) => !zxingOnlyTypes.has(codeType));
  return requested.map((codeType) => typeFormats[codeType][0]);
}

export default toDetectorFormats;
