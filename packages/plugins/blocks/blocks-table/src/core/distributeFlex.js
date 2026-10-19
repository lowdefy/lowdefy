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

// Spreads spare viewport width over `flex` columns the user has not resized, by flex weight.
function distributeFlex({ cols, viewportWidth, sizing }) {
  const total = cols.reduce((sum, col) => sum + col.width, 0);
  const spare = viewportWidth - total;
  if (spare <= 0) return;
  const flexCols = cols.filter(
    (col) => !col.special && col.column.flex > 0 && sizing[col.key] === undefined
  );
  const weight = flexCols.reduce((sum, col) => sum + col.column.flex, 0);
  if (weight === 0) return;
  flexCols.forEach((col) => {
    const grown = col.width + Math.floor((spare * col.column.flex) / weight);
    col.width = Math.min(col.maxWidth, grown);
  });
}

export default distributeFlex;
