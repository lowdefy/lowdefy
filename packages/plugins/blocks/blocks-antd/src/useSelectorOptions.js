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

import getSelectorOptions from './getSelectorOptions.js';
import useSetData from './useSetData.js';

// Builds the normalised selector entries from `options`, or from `data` (which may be supplied
// imperatively via `setData`). Memoised so a large dataset is mapped once, not on every render —
// when `data` comes from `setData` the dependencies are stable across unrelated re-renders.
export default function useSelectorOptions({ properties, methods }) {
  const data = useSetData({ properties, methods });
  return useMemo(
    () => getSelectorOptions({ properties: { ...properties, data } }),
    [data, properties.options, properties.valueKey, properties.primaryKey, properties.html]
  );
}
