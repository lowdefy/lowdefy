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

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Reads the PNG header without decoding the image: the IHDR chunk gives width,
// height and colour type, and a tRNS chunk (which must come before IDAT) adds
// transparency to an image whose colour type has no alpha channel.
// Returns null when the buffer is not a PNG.
function readPngInfo(buffer) {
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return null;
  }
  if (buffer.toString('ascii', 12, 16) !== 'IHDR') {
    return null;
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const colorType = buffer.readUInt8(25);
  let hasTransparencyChunk = false;
  let offset = 8;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const chunkType = buffer.toString('ascii', offset + 4, offset + 8);
    if (chunkType === 'tRNS') {
      hasTransparencyChunk = true;
      break;
    }
    if (chunkType === 'IDAT' || chunkType === 'IEND') {
      break;
    }
    offset += 12 + length;
  }
  return { width, height, colorType, hasTransparencyChunk };
}

export default readPngInfo;
