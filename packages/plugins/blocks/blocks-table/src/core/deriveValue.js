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

import isDefaultViewColumns from './isDefaultViewColumns.js';

// The block value is derived from table state, never kept alongside it.
function deriveValue({ state, api }) {
  const entries = state.columnOrder.map((key) =>
    Object.assign(
      { key },
      ...api.features.list.map((feature) => feature.toViewColumn?.({ key, state, api }) ?? {})
    )
  );
  const view = { ...state.viewPassthrough };
  if (!isDefaultViewColumns({ entries, config: api.config })) view.columns = entries;
  const value = { view, selected: [], expanded: state.expanded };
  api.features.list.forEach((feature) => {
    const part = feature.toValue?.({ state, api });
    if (!part) return;
    Object.entries(part).forEach(([key, partValue]) => {
      if (key === 'view') {
        Object.assign(view, partValue);
      } else {
        value[key] = partValue;
      }
    });
  });
  return value;
}

export default deriveValue;
