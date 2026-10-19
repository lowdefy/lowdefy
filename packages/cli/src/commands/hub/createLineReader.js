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

function parseLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

// The hub speaks newline-delimited JSON objects in both directions. Anything
// else is dropped: thrown from a socket data handler it would crash the hub,
// which every agent session shares, over one bad client.
function createLineReader({ onMessage }) {
  let buffer = '';
  return function onData(chunk) {
    buffer += chunk;
    let index = buffer.indexOf('\n');
    while (index >= 0) {
      const message = parseLine(buffer.slice(0, index));
      buffer = buffer.slice(index + 1);
      if (type.isObject(message)) {
        onMessage(message);
      }
      index = buffer.indexOf('\n');
    }
  };
}

export default createLineReader;
