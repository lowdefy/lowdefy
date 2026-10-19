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

const EMPTY = [];

// Stage 1 of the data pipeline (see TableRoot): the source rows, before they are diffed by key.
// `data` is the client rows (`properties.data`, or the rows held while a refetch loads); a feature's `useData(ctx)` hook may replace them in
// registry order: server mode returns the rows its block cache holds, and a tree built from
// `childrenField` flattens nested rows (so every node is diffed by key). The registry is a
// module constant, so the hook order never changes between renders.
function useFeatureData({ api, config, data: clientData, properties }) {
  let data = type.isArray(clientData) ? clientData : EMPTY;
  api.features.list.forEach((feature) => {
    if (!feature.useData) return;
    data = feature.useData({ api, config, data, properties });
  });
  return data;
}

export default useFeatureData;
