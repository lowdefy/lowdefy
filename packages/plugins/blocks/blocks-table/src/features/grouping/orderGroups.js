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
import resolveOption from '@lowdefy/blocks-antd/table/resolveOption.js';

function optionRank({ options, value, unlisted }) {
  const option = resolveOption({ options, value });
  return type.isUndefined(option) ? unlisted : option.index;
}

// Sibling groups in display order: by the column's sort when the view sorts on it, else by
// option order for enum columns (values without an option after them), else by first
// appearance in the sorted rows. The empty group always comes last.
function orderGroups({ groups, level }) {
  const filled = groups.filter((group) => !group.empty);
  const empty = groups.filter((group) => group.empty);
  if (level.order === 'sort') {
    const direction = level.desc ? -1 : 1;
    filled.sort((a, b) => direction * level.compare(a.value, b.value));
  }
  if (level.order === 'options') {
    const unlisted = level.options.length;
    // Array sort is stable, so values without an option keep their appearance order.
    filled.sort(
      (a, b) =>
        optionRank({ options: level.options, value: a.value, unlisted }) -
        optionRank({ options: level.options, value: b.value, unlisted })
    );
  }
  return filled.concat(empty);
}

export default orderGroups;
