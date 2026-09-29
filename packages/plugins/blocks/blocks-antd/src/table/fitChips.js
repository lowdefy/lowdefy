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

// How many of a cell's chips show whole in its content `width`, with a `+N` count after them for
// the rest. `widths` are the outer widths of the chips that may show (the first `cell.max`, or
// all), `total` the number of values, `moreWidth(n)` the width of the `+n` count and `gap` the
// space between items. At least one chip shows (a chip wider than the cell is cut at its own
// edge), so a narrow column still says what the first value is.
function fitChips({ widths, total, moreWidth, gap, width }) {
  let used = 0;
  if (widths.length === total) {
    for (let i = 0; i < total; i++) used += widths[i] + (i > 0 ? gap : 0);
    if (used <= width) return total;
    used = 0;
  }
  let fitted = 0;
  for (let i = 0; i < widths.length && i < total - 1; i++) {
    const next = used + widths[i] + (i > 0 ? gap : 0);
    if (next + gap + moreWidth(total - i - 1) > width) break;
    used = next;
    fitted = i + 1;
  }
  return Math.max(fitted, 1);
}

export default fitChips;
