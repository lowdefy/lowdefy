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

import path from 'node:path';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Replaces an absolute directory, and the path that follows it, with a
// placeholder, as createPathReplacer in @lowdefy/build's
// index.snapshots.test.js does: the rest of the path is written with '/'.
function createPathReplacer({ directory, placeholder }) {
  const sep = escapeRegExp(path.sep);
  const pattern = new RegExp(`${escapeRegExp(directory)}((?:${sep}[^${sep}"'\\s:]*)*)`, 'g');
  return (value) =>
    value.replace(pattern, (match, rest) => `${placeholder}${rest.split(path.sep).join('/')}`);
}

export default createPathReplacer;
