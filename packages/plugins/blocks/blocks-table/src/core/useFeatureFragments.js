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

import { useMemo } from 'react';

import features from '../features/index.js';

const EMPTY = [];

// Block-level feature hooks in registry order. A fragment may contribute:
// - `leadingColumns`: special columns rendered first in the start-pinned region (the selection
//   checkbox; later a drag handle or expander),
// - `trailingColumns`: special columns rendered last, pinned to the end (enrichment's add-column
//   header and row run buttons),
// - `regions.top` / `regions.bottom`: elements rendered above or below the grid inside the table
//   root (toolbar, bulk bar, pagination),
// - `loading: true`: the table is waiting for data it cannot show yet (server mode's first block),
// - `pending: true`: the rows shown are about to be replaced, so they are dimmed (server mode keeps
//   the previous view's rows until the new view's first block lands).
function useFeatureFragments(ctx) {
  const fragments = features.map((feature) => feature.useFeature?.(ctx) ?? null);
  const leadingParts = fragments.map((fragment) => fragment?.leadingColumns ?? EMPTY);
  const leadingColumns = useMemo(() => leadingParts.flat(), leadingParts);
  const trailingParts = fragments.map((fragment) => fragment?.trailingColumns ?? EMPTY);
  const trailingColumns = useMemo(() => trailingParts.flat(), trailingParts);
  const top = [];
  const bottom = [];
  fragments.forEach((fragment, index) => {
    const name = features[index].name;
    if (fragment?.regions?.top) top.push({ name, element: fragment.regions.top });
    if (fragment?.regions?.bottom) bottom.push({ name, element: fragment.regions.bottom });
  });
  const loading = fragments.some((fragment) => fragment?.loading === true);
  const pending = fragments.some((fragment) => fragment?.pending === true);
  return { leadingColumns, loading, pending, regions: { top, bottom }, trailingColumns };
}

export default useFeatureFragments;
