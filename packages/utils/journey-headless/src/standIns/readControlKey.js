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

import HeadlessStepError from '../HeadlessStepError.js';
import describeBlock from './describeBlock.js';

// The control key of a click target on a block that draws no grid (a modal, a dropdown, a menu):
// a rowKey or column names a grid row or cell, which such a block never has, so the browser would
// find no match.
function readControlKey({ block, target }) {
  const gridKey = ['rowKey', 'column'].find((key) => !type.isUndefined(target[key]));
  if (!type.isUndefined(gridKey)) {
    throw new HeadlessStepError(
      `${describeBlock(block)} draws no grid rows: "${gridKey}" names a row or cell of a grid.`,
      { actual: block.type, expected: `a grid block for "${gridKey}"` }
    );
  }
  return String(target.control);
}

export default readControlKey;
