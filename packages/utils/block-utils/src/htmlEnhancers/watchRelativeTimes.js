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

import formatDate from '../format/formatDate.js';

const INTERVAL = 30000;

// One timer for every relative time in every HtmlComponent (each ag-grid cell
// is its own HtmlComponent). It runs only while something is watched.
const watched = new Set();
let timer = null;

function tick() {
  watched.forEach((entry) => {
    const text = formatDate({ value: entry.value, relative: true });
    if (entry.node.data !== text) {
      entry.node.data = text;
    }
  });
}

// Keeps { node, value } entries' text relative to now, until the returned
// function unwatches them.
function watchRelativeTimes(entries) {
  entries.forEach((entry) => watched.add(entry));
  if (timer === null && watched.size > 0) {
    timer = setInterval(tick, INTERVAL);
  }
  return function unwatch() {
    entries.forEach((entry) => watched.delete(entry));
    if (watched.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export default watchRelativeTimes;
