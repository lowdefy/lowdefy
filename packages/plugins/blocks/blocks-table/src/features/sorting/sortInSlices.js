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

import yieldToMain from './yieldToMain.js';

const RUN = 1024;

function merge({ source, target, start, middle, end, compare }) {
  let left = start;
  let right = middle;
  for (let i = start; i < end; i++) {
    if (left < middle && (right >= end || compare(source[left], source[right]) <= 0)) {
      target[i] = source[left];
      left += 1;
    } else {
      target[i] = source[right];
      right += 1;
    }
  }
}

// A stable bottom-up merge sort that yields to the browser whenever a slice has run for
// `budgetMs`, so sorting 100k strings with Intl.Collator never blocks the main thread for long.
async function sortInSlices({ items, compare, budgetMs = 12 }) {
  const count = items.length;
  let source = items.slice();
  let target = new Array(count);
  let sliceStart = performance.now();
  async function maybeYield() {
    if (performance.now() - sliceStart < budgetMs) return;
    await yieldToMain();
    sliceStart = performance.now();
  }
  for (let start = 0; start < count; start += RUN) {
    const end = Math.min(start + RUN, count);
    const run = source.slice(start, end).sort(compare);
    for (let i = 0; i < run.length; i++) source[start + i] = run[i];
    await maybeYield();
  }
  for (let width = RUN; width < count; width *= 2) {
    for (let start = 0; start < count; start += 2 * width) {
      const middle = Math.min(start + width, count);
      const end = Math.min(start + 2 * width, count);
      merge({ source, target, start, middle, end, compare });
      await maybeYield();
    }
    [source, target] = [target, source];
  }
  return source;
}

export default sortInSlices;
