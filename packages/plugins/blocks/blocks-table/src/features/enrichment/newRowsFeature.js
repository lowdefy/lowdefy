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

import useEnrichmentRows from './useEnrichmentRows.js';

// The enrichment module's data pipeline part (stage 3): Table's optimistic "+ New row" rows,
// appended after transactions and editing have laid their overlays, so a row saving never
// changes the rows those overlays hold on to. A module of its own for its place in the registry
// (the enrichment module sits early for its handlers), as serverRange is for serverData.
const newRowsFeature = {
  name: 'newRows',
  useRows: useEnrichmentRows,
};

export default newRowsFeature;
