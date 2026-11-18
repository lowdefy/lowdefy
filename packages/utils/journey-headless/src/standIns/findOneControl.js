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

import HeadlessStepError from '../HeadlessStepError.js';
import describeBlock from './describeBlock.js';

// The one control keyed `control` among a block's controls ([{ key, ... }]), as the browser
// clicks only a single visible match: none fails naming the keys the block has, and several fail
// with the count.
function findOneControl({ block, control, controls, noun }) {
  const matches = controls.filter((item) => item.key === control);
  if (matches.length === 1) {
    return matches[0];
  }
  const description = describeBlock(block);
  if (matches.length === 0) {
    const keys = controls.map((item) => item.key);
    throw new HeadlessStepError(
      `${description} has no ${noun} keyed "${control}". ${
        keys.length === 0 ? `It has no ${noun}s.` : `Its ${noun} keys: ${keys.join(', ')}.`
      }`,
      { actual: `no ${noun} "${control}"`, expected: `a ${noun} "${control}" in ${description}` }
    );
  }
  throw new HeadlessStepError(
    `${description} has ${matches.length} ${noun}s keyed "${control}"; a control target names one.`,
    { actual: `${matches.length} ${noun}s`, expected: `exactly one ${noun} "${control}"` }
  );
}

export default findOneControl;
