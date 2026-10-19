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

// Scrolls the table at a fixed velocity from rAF for `durationMs`, sampling each frame whether the
// rendered rows covered the viewport at the position painted in the previous frame (blank area).
async function scrollProgrammatic({ page, pxPerSecond, durationMs, axis = 'y', bounce = false }) {
  return page.evaluate(
    ({ pxPerSecond, durationMs, axis, bounce }) =>
      new Promise((resolve) => {
        const scroller = document.querySelector('#bench_table .lf-table-scroller');
        const rowHeight = 40;
        const headerHeight = 40;
        let blankFrames = 0;
        let checkedFrames = 0;
        let direction = 1;
        let started = null;
        let last = null;
        function check() {
          const rows = scroller.querySelectorAll('.lf-table-body [data-row-index]');
          if (!rows.length) return;
          const first = Number(rows[0].dataset.rowIndex);
          const lastRow = Number(rows[rows.length - 1].dataset.rowIndex);
          const top = scroller.scrollTop;
          const bodyHeight = scroller.clientHeight - headerHeight;
          const visibleFirst = Math.floor(top / rowHeight);
          const visibleLast = Math.floor((top + bodyHeight - 1) / rowHeight);
          checkedFrames += 1;
          if (visibleFirst < first || visibleLast > lastRow) blankFrames += 1;
        }
        function frame(time) {
          if (started === null) {
            started = time;
            last = time;
          }
          check();
          const delta = ((time - last) / 1000) * pxPerSecond * direction;
          last = time;
          if (axis === 'y') {
            scroller.scrollTop += delta;
            const max = scroller.scrollHeight - scroller.clientHeight;
            if (bounce && (scroller.scrollTop >= max || scroller.scrollTop <= 0)) direction *= -1;
          } else {
            scroller.scrollLeft += delta;
            const max = scroller.scrollWidth - scroller.clientWidth;
            if (scroller.scrollLeft >= max || scroller.scrollLeft <= 0) direction *= -1;
          }
          if (time - started < durationMs) {
            requestAnimationFrame(frame);
          } else {
            resolve({ blankFrames, checkedFrames });
          }
        }
        requestAnimationFrame(frame);
      }),
    { pxPerSecond, durationMs, axis, bounce }
  );
}

export default scrollProgrammatic;
