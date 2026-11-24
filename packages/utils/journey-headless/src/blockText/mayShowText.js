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

import normalizeShownText from './normalizeShownText.js';

// Whether a browser may read `contains` in text drawn as these units, in an order and with a
// layout a headless page does not know: each unit a stretch of text normalizeShownText has
// folded, which the page may draw in any order, with any white space between them. It may when
// one unit holds the text, or when the text could run across units: a unit ending with its start,
// units it holds whole, then a unit starting with its rest. This takes any unit more than once,
// so it says "may" more often than a browser would read it, never less.
function mayShowText({ contains, units }) {
  const needle = normalizeShownText(contains);
  const texts = units.filter((unit) => unit !== '');
  if (needle === '') return true;
  if (texts.some((text) => text.includes(needle))) return true;
  const reached = new Set();
  const queue = [];
  function reach(position) {
    if (!reached.has(position)) {
      reached.add(position);
      queue.push(position);
    }
  }
  texts.forEach((text) => {
    for (let length = 1; length < needle.length; length += 1) {
      if (text.endsWith(needle.slice(0, length))) reach(length);
    }
  });
  while (queue.length > 0) {
    const position = queue.shift();
    const rest = needle.slice(position);
    for (const text of texts) {
      if (text.startsWith(rest)) return true;
      if (text.length < rest.length && rest.startsWith(text)) reach(position + text.length);
    }
  }
  return false;
}

export default mayShowText;
