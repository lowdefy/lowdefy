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

import createSelectAllMatching from './createSelectAllMatching.js';
import useBulkBar from './useBulkBar.js';

// The bulk action bar shown while rows are selected (D7, ux.md pattern 8).
const bulkFeature = {
  name: 'bulk',
  actions: { selectAllMatching: createSelectAllMatching },
  methods: { selectAllMatching: createSelectAllMatching },
  useFeature: useBulkBar,
};

export default bulkFeature;
