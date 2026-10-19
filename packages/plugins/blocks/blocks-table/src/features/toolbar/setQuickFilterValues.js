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

import getRootConditions from './getRootConditions.js';
import isQuickFilterLeaf from './isQuickFilterLeaf.js';

// The filter with a quick filter chip's leaf replaced: `{ key, op: 'in', value }` ANDed with the
// rest of the filter, or removed when no values are checked. Other conditions are kept as they
// are; a filter left with no conditions is null.
function setQuickFilterValues({ filter, key, values }) {
  const conditions = getRootConditions(filter).filter(
    (condition) => !isQuickFilterLeaf({ condition, key })
  );
  if (values.length > 0) conditions.push({ key, op: 'in', value: values });
  if (conditions.length === 0) return null;
  return { and: conditions };
}

export default setQuickFilterValues;
