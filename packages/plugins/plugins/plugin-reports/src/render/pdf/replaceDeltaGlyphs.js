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

// Roboto has no Geometric Shapes or Arrows glyphs, so the ▲ ▼ ↑ ↓ dashboards use
// for deltas would print as boxes. Replace them with a signed, coloured mark the
// face does have; antd's success and error colours, as translateText's tints.
const UP = { text: '+', color: '#389e0d' };
const DOWN = { text: '−', color: '#cf1322' };
const DELTA_GLYPHS = {
  '▲': UP,
  '▴': UP,
  '△': UP,
  '↑': UP,
  '↗': UP,
  '⇧': UP,
  '▼': DOWN,
  '▾': DOWN,
  '▽': DOWN,
  '↓': DOWN,
  '↘': DOWN,
  '⇩': DOWN,
};
const DELTA_RUN = new RegExp(`[${Object.keys(DELTA_GLYPHS).join('')}]`, 'g');

// Split one string into pdfmake text runs around its delta glyphs. Returns the
// string itself when it has none so untouched text stays a plain string.
function splitRuns(text) {
  if (!DELTA_RUN.test(text)) return text;
  DELTA_RUN.lastIndex = 0;
  const runs = [];
  let last = 0;
  for (const match of text.matchAll(DELTA_RUN)) {
    if (match.index > last) runs.push(text.slice(last, match.index));
    runs.push(DELTA_GLYPHS[match[0]]);
    last = match.index + 1;
  }
  if (last < text.length) runs.push(text.slice(last));
  return runs;
}

// Walk the translated pdfmake content and replace delta glyphs in every text
// run. Runs inherit the surrounding style (bold, size) the way pdfmake nests
// text, so only the glyph and its colour change. svg and image content are not
// document text.
function replaceDeltaGlyphs(content) {
  const visit = (value, key) => {
    if (type.isString(value)) return key === 'text' ? splitRuns(value) : value;
    if (type.isArray(value)) {
      return value.map((item) => {
        if (type.isString(item) && key === 'text') {
          const runs = splitRuns(item);
          return type.isArray(runs) ? { text: runs } : runs;
        }
        return visit(item, key);
      });
    }
    if (type.isObject(value)) {
      return Object.fromEntries(
        Object.entries(value).map(([k, item]) => {
          if (k === 'svg' || k === 'image') return [k, item];
          return [k, visit(item, k)];
        })
      );
    }
    return value;
  };
  return visit(content, undefined);
}

export default replaceDeltaGlyphs;
