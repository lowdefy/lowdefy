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

// Marks the scroller while columns are scrolled under the pinned regions: `data-scrolled-start`
// once it scrolls away from the start, `data-scrolled-end` until it reaches the end. The pinned
// edge cells show their shadow from these (table.css). Attributes are written only when they
// change, so a scroll frame costs no style recalculation; the reads come from the frame's own
// range update, after its layout is already done.
function writeScrollEdges({ element, edges }) {
  const left = Math.abs(element.scrollLeft);
  const start = left > 0.5;
  const end = left < element.scrollWidth - element.clientWidth - 0.5;
  if (start !== edges.start) {
    element.toggleAttribute('data-scrolled-start', start);
    edges.start = start;
  }
  if (end !== edges.end) {
    element.toggleAttribute('data-scrolled-end', end);
    edges.end = end;
  }
}

export default writeScrollEdges;
