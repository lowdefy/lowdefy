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

import HeadlessStepError from './HeadlessStepError.js';

// Values a person cannot type: a fill types into a text input, a textarea or a colour picker.
const UNTYPED_VALUE_TYPES = new Set(['array', 'boolean', 'object']);
const HEX_COLOUR = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;

// What the browser's fill refuses, checked on the engine's block before its value is set: a
// disabled block, a block with no text input to type into (its value is a list, a switch or an
// object), and a colour picker given something other than a 6 or 8 digit hex colour.
function checkFillTarget({ block, value }) {
  const description = `block "${block.blockId}" (${block.type})`;
  if (block.eval?.properties?.disabled === true) {
    throw new HeadlessStepError(`The input in ${description} is disabled.`, {
      actual: 'disabled',
      expected: `an enabled input in ${description}`,
    });
  }
  const valueType = block.context._internal.lowdefy._internal.blockMetas[block.type]?.valueType;
  if (UNTYPED_VALUE_TYPES.has(valueType) || block.meta?.category !== 'input') {
    throw new HeadlessStepError(
      `Fill found no input in ${description} to type into: fill types into a text input, textarea or colour picker.`,
      { actual: block.type, expected: `a text input or colour picker in ${description}` }
    );
  }
  if (block.type === 'ColorSelector' && !HEX_COLOUR.test(String(value))) {
    throw new HeadlessStepError(
      `Fill of the colour picker in ${description} takes a 6 or 8 digit hex colour, such as #1677ff; got ${JSON.stringify(
        value
      )}.`,
      { actual: value, expected: 'a 6 or 8 digit hex colour' }
    );
  }
}

export default checkFillTarget;
