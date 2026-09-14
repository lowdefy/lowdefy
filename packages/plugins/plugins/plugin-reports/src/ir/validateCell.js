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

import invalidNode from './invalidNode.js';
import validateCellValue from './validateCellValue.js';

function validateCell(cellNode, kind) {
  if (!type.isObject(cellNode) || !Object.prototype.hasOwnProperty.call(cellNode, 'value')) {
    throw invalidNode(kind, "a cell must be an object with a 'value' property.");
  }
  if (!validateCellValue(cellNode.value)) {
    throw invalidNode(
      kind,
      `a cell value must be a string, number, boolean, null, or Date. Received ${JSON.stringify(
        cellNode.value
      )}.`
    );
  }
  if (cellNode.formatted !== undefined && !type.isString(cellNode.formatted)) {
    throw invalidNode(kind, "a cell 'formatted' must be a string when present.");
  }
}

export default validateCell;
