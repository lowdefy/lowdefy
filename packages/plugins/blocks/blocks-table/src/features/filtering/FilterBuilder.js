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

import React from 'react';

import FilterGroup from './FilterGroup.js';
import getGroupOperator from './getGroupOperator.js';
import toRootGroup from './toRootGroup.js';
import useSyncedState from './useSyncedState.js';

// The nested And/Or condition editor (D6, D7), shared by the column filter popover ("Advanced")
// and the toolbar filter. Props:
// - `condition`: the Condition to edit (a group, a leaf, or null),
// - `columns`: the normalised columns conditions may use (pass the filterable ones),
// - `user`: the user object, to show what `{ $user: path }` values resolve to,
// - `components`: Lowdefy's components (tag chips with icons in the value lists),
// - `onChange(condition)`: called with the edited condition; null once it has no conditions.
// Conditions still being built (no value yet) are written as they are; the table's filter
// ignores them until they are complete.
function FilterBuilder({ components, condition, columns, user, onChange }) {
  const [local, setLocal] = useSyncedState({ value: condition ?? null, onChange });
  const root = toRootGroup(local);
  return (
    <div className="lf-filter-builder" data-lf-filter-builder="">
      <FilterGroup
        columns={columns}
        components={components}
        depth={1}
        group={root}
        onChange={(next) => setLocal(next[getGroupOperator(next)].length ? next : null)}
        user={user}
      />
    </div>
  );
}

export default FilterBuilder;
