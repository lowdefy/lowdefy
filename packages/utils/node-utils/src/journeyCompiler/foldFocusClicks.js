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

import isSameBlock from './isSameBlock.js';

function isUnlabelledClick(record) {
  if (record.kind !== 'click' || record.target?.option === true) return false;
  return !type.isString(record.target?.text) || record.target.text === '';
}

// `fill` focuses the input itself, so the click that focused it before typing
// is not a step. A text input has no text, so a labelled option is never taken
// for a focus click. Engine records between the two do not separate them.
function foldFocusClicks({ records }) {
  return records.filter((record, index) => {
    if (!isUnlabelledClick(record)) return true;
    const next = records.slice(index + 1).find((candidate) => candidate.kind !== 'engine');
    return !(next?.kind === 'change' && isSameBlock({ a: next, b: record }));
  });
}

export default foldFocusClicks;
