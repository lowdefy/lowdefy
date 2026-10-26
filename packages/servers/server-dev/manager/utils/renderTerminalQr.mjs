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

import qrcodegen from '@rc-component/qrcode/lib/libs/qrcodegen.js';

const { Ecc, QrCode } = qrcodegen;

const MARGIN = 2;
// Black on white whatever the terminal's own colours: a scanner needs dark
// modules on a light background.
const START = '\x1b[30;47m';
const RESET = '\x1b[0m';

// Two rows of modules per line of text, drawn with half blocks.
function renderTerminalQr(text) {
  const qr = QrCode.encodeText(text, Ecc.LOW);
  function isDark(x, y) {
    return x >= 0 && y >= 0 && x < qr.size && y < qr.size && qr.getModule(x, y);
  }
  const lines = [];
  for (let y = -MARGIN; y < qr.size + MARGIN; y += 2) {
    let line = '';
    for (let x = -MARGIN; x < qr.size + MARGIN; x += 1) {
      const top = isDark(x, y);
      const bottom = isDark(x, y + 1);
      if (top && bottom) {
        line += '█';
      } else if (top) {
        line += '▀';
      } else if (bottom) {
        line += '▄';
      } else {
        line += ' ';
      }
    }
    lines.push(`${START}${line}${RESET}`);
  }
  return lines.join('\n');
}

export default renderTerminalQr;
