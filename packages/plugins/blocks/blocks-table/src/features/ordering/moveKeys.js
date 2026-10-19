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

// Rewrites `order` so the keys of `sequence` take the positions those keys already held, in the
// sequence's new order. Keys outside the sequence (hidden columns, other regions) stay put.
function moveKeys({ order, sequence }) {
  const members = new Set(sequence);
  let next = 0;
  return order.map((key) => {
    if (!members.has(key)) return key;
    const replacement = sequence[next];
    next += 1;
    return replacement;
  });
}

export default moveKeys;
