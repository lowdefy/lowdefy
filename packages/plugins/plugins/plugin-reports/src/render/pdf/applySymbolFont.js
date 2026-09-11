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

import { SYMBOL_FONT_FAMILY } from '../../fonts/fonts.js';

// The Unicode blocks Roboto does not cover and DejaVu Sans does: Arrows,
// Miscellaneous Technical, Geometric Shapes, Miscellaneous Symbols, Dingbats,
// the supplemental arrow blocks, and Miscellaneous Symbols and Arrows. Roboto
// has a handful of glyphs inside these ranges (● ◊); routing them to DejaVu too
// costs nothing and keeps the rule a range test instead of a per-glyph lookup.
const SYMBOL_RUN =
  /[\u2190-\u21FF\u2300-\u23FF\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF\u27F0-\u27FF\u2900-\u297F\u2B00-\u2BFF]+/g;

// Split one string into pdfmake text runs, symbol runs carrying the fallback
// font. Returns the string itself when it has no symbols so untouched text stays
// a plain string.
function splitRuns(text) {
  if (!SYMBOL_RUN.test(text)) return text;
  SYMBOL_RUN.lastIndex = 0;
  const runs = [];
  let last = 0;
  for (const match of text.matchAll(SYMBOL_RUN)) {
    if (match.index > last) runs.push(text.slice(last, match.index));
    runs.push({ text: match[0], font: SYMBOL_FONT_FAMILY });
    last = match.index + match[0].length;
  }
  if (last < text.length) runs.push(text.slice(last));
  return runs;
}

// pdfmake picks one font per text run and has no glyph fallback, so this walks
// the translated content and wraps every symbol run in the fallback font. Runs
// inherit the surrounding style (bold, colour, size) the way pdfmake nests text,
// so only the face changes. svg and image content are not document text.
function applySymbolFont(content) {
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

export default applySymbolFont;
