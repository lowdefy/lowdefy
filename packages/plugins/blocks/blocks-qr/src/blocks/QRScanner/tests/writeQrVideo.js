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

import fs from 'node:fs';
import { createRequire } from 'node:module';
import { prepareZXingModule, writeBarcode } from 'zxing-wasm/writer';

const require = createRequire(import.meta.url);

// Writes a one-frame YUV4MPEG2 video of a QR code holding text, for Chromium's fake camera
// (--use-file-for-fake-video-capture). zxing-wasm's writer draws the code's modules; each is
// drawn as a moduleSize square of black on white, centred in a size x size frame.
async function writeQrVideo({ filePath, moduleSize = 8, size = 320, text }) {
  prepareZXingModule({
    overrides: {
      wasmBinary: fs.readFileSync(require.resolve('zxing-wasm/writer/zxing_writer.wasm')),
    },
  });
  const { error, symbol } = await writeBarcode(text, { format: 'QRCode', scale: 1 });
  if (error) {
    throw new Error(`writeQrVideo could not write the QR code: ${error}`);
  }
  const luma = Buffer.alloc(size * size, 255);
  const offset = Math.floor((size - symbol.width * moduleSize) / 2);
  for (let row = 0; row < symbol.height; row += 1) {
    for (let column = 0; column < symbol.width; column += 1) {
      if (symbol.data[row * symbol.width + column] === 0) {
        for (let y = 0; y < moduleSize; y += 1) {
          const start = (offset + row * moduleSize + y) * size + offset + column * moduleSize;
          luma.fill(0, start, start + moduleSize);
        }
      }
    }
  }
  const chroma = Buffer.alloc((size / 2) * (size / 2) * 2, 128);
  const header = Buffer.from(`YUV4MPEG2 W${size} H${size} F10:1 Ip A1:1 C420jpeg\nFRAME\n`);
  fs.writeFileSync(filePath, Buffer.concat([header, luma, chroma]));
}

export default writeQrVideo;
