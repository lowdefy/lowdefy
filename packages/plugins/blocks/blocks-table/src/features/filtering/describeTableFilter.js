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

import { describeCondition } from '@lowdefy/helpers';

import getPlainTitle from './getPlainTitle.js';
import pruneCondition from './pruneCondition.js';

// The table's filter in words, from its columns in the shape MongoDBTableQuery fields take, so a
// server request given the same titles and options returns the same sentence. Conditions still
// being built filter nothing, so they are left out, as they are from the rows.
function describeTableFilter({ condition, columns }) {
  const fields = Object.fromEntries(
    columns.map((column) => [
      column.key,
      { title: getPlainTitle(column), type: column.type, options: column.options },
    ])
  );
  return describeCondition({ condition: pruneCondition(condition), fields });
}

export default describeTableFilter;
