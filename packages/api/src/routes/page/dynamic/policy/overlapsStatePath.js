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

// Whether two state paths name the same value or one holds the other. A "$"
// segment (an id inside a list) matches any segment.
function overlapsStatePath({ key, id }) {
  const keyParts = key.split('.');
  const idParts = id.split('.');
  const length = Math.min(keyParts.length, idParts.length);
  for (let index = 0; index < length; index += 1) {
    const keyPart = keyParts[index];
    const idPart = idParts[index];
    if (keyPart !== idPart && keyPart !== '$' && idPart !== '$') return false;
  }
  return true;
}

export default overlapsStatePath;
