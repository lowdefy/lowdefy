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

import { useState } from 'react';

// Block-level UI state of the filtering feature: which column's filter popover is open, and the
// latest requested filter and search while they are prepared and applied (applyFiltering). The
// request is dropped once the committed state has caught up with it.
function useFilteringState({ api, state }) {
  const [openKey, setOpenKey] = useState(null);
  api.columnFilter = { openKey, setOpenKey };
  const target = api.filtering?.target ?? null;
  const caughtUp =
    target !== null && target.filter === state.filter && target.search === state.search;
  api.filtering = { target: caughtUp ? null : target };
  return null;
}

export default useFilteringState;
