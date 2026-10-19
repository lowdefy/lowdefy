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

// A random RFC 4122 version 4 UUID for a row added in the browser. The key can outlive the
// table: "+ New row" sends it to onRowAdd for the app to store as the row's _id, so it has to be
// unique across every browser and every row ever stored, not only within the table's value.
// crypto.randomUUID is missing on insecure origins (plain http on a LAN address), where
// crypto.getRandomValues still is, so the UUID is built from 16 random bytes there.
function generateRowKey() {
  if (typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  // Version 4 in the high nibble of byte 6, the RFC 4122 variant (10xx) in byte 8.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

export default generateRowKey;
