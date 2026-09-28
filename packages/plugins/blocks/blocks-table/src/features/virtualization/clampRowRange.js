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

// The rendered row range is state, updated in a layout effect after the row count changes. In the
// render where rows shrink (a delete, a refetch with fewer rows) it still spans the old count, so
// it is clamped to the rows there are.
function clampRowRange({ range, rowCount }) {
  if (range.rowEnd <= rowCount) return range;
  return { ...range, rowStart: Math.min(range.rowStart, rowCount), rowEnd: rowCount };
}

export default clampRowRange;
