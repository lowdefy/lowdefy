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

function isRow(value) {
  return type.isInt(value) && value >= 0;
}

function validateRows({ startRow, endRow, maxRows }) {
  const start = startRow ?? 0;
  if (!isRow(start)) {
    throw new Error(
      `MongoDBTableQuery startRow must be a non-negative integer. Received ${JSON.stringify(
        startRow
      )}.`
    );
  }
  const end = endRow ?? start + maxRows;
  if (!isRow(end) || end < start) {
    throw new Error(
      `MongoDBTableQuery endRow must be an integer not less than startRow (${start}). Received ${JSON.stringify(
        endRow
      )}.`
    );
  }
  if (end - start > maxRows) {
    throw new Error(
      `MongoDBTableQuery requested ${
        end - start
      } rows (startRow ${start} to endRow ${end}), more than maxRows (${maxRows}).`
    );
  }
  return { startRow: start, endRow: end };
}

export default validateRows;
