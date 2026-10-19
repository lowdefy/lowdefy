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

let counter = 0;

// A key for a row added in the browser. It only has to be unique within the table's value;
// crypto.randomUUID is missing on insecure origins (plain http on a LAN address).
function generateRowKey() {
  if (typeof window.crypto?.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  counter += 1;
  return `row_${Date.now().toString(36)}_${counter.toString(36)}`;
}

export default generateRowKey;
