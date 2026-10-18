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

import formatLanPairing from './formatLanPairing.mjs';

const lan = { name: 'en0', address: '192.168.1.20', token: 'tok_en-123' };

test('formatLanPairing names the interface and prints the Lowdefy Dev link with the token', () => {
  const lines = formatLanPairing({ lan, port: 3000, basePath: '/app' }).split('\n');
  expect(lines[0]).toEqual(
    'Phone pairing on en0 (http://192.168.1.20:3000/app). Wrong network? Restart with --lan <interface>.'
  );
  expect(lines[lines.length - 1]).toEqual(
    'lowdefy-dev://connect?url=http%3A%2F%2F192.168.1.20%3A3000%2Fapp&pair=tok_en-123'
  );
});

test('formatLanPairing draws a square QR code in black on white', () => {
  const lines = formatLanPairing({ lan, port: 3000, basePath: '' }).split('\n');
  const qrLines = lines.filter((line) => line.startsWith('\x1b[30;47m'));
  expect(qrLines.length).toBeGreaterThan(10);
  // Two module rows per text line, so the code is about twice as wide as tall.
  const width = qrLines[0].replace(/\x1b\[[0-9;]*m/g, '').length;
  expect(qrLines.every((line) => line.endsWith('\x1b[0m'))).toBe(true);
  expect(Math.abs(width - 2 * qrLines.length)).toBeLessThanOrEqual(1);
});
