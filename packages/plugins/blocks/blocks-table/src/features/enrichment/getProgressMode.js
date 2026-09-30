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

// Widths of the chip's pieces that are not text, matching enrichment.css: the chip's padding
// and border, the icon before a status, the gap after an icon and the gap between parts.
const CHIP_INSET = 14;
const ICON = 12;
const ICON_GAP = 3;
const PART_GAP = 6;

// The statuses in the order the chip drops them when it runs out of room: queued first, then
// running, so an error count is the last to go before the dot.
const DROP_ORDER = ['queued', 'running', 'error'];

function fullWidth({ progress, measure }) {
  return CHIP_INSET + ICON + ICON_GAP + measure.smallText(progress.text);
}

function compactWidth({ parts, measure }) {
  const counts = parts.reduce(
    (sum, part) => sum + ICON + ICON_GAP + measure.smallText(part.count),
    0
  );
  return CHIP_INSET + counts + PART_GAP * (parts.length - 1);
}

// Which form of the header progress chip (`progress`, from getProgressParts) fits `room` (the
// header's width beside its title and indicators), as `{ mode, parts }`: `full` ("3 running ·
// 1 queued · 1 error"), `compact` (an icon and a count per status), `partial` (an icon and a
// count for the most important statuses only: queued goes first, then running, so errors and
// running cells stay counted as long as they fit) or `dot` (the most severe status' colour). Every
// form's tooltip lists all the counts. The title keeps its room: the chip takes the largest form
// that fits, and the dot when none does. Widths come from the table's text measure (canvas widths
// cached by text), so this is a few Map reads.
function getProgressMode({ progress, measure, room }) {
  if (fullWidth({ progress, measure }) <= room) return { mode: 'full', parts: progress.parts };
  if (compactWidth({ parts: progress.parts, measure }) <= room) {
    return { mode: 'compact', parts: progress.parts };
  }
  let parts = progress.parts;
  for (const status of DROP_ORDER) {
    if (parts.length === 1) break;
    parts = parts.filter((part) => part.status !== status);
    if (parts.length < progress.parts.length && compactWidth({ parts, measure }) <= room) {
      return { mode: 'partial', parts };
    }
  }
  return { mode: 'dot', parts: [] };
}

export default getProgressMode;
