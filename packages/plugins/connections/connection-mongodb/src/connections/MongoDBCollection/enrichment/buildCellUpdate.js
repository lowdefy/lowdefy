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

import enrichPath from './enrichPath.js';

// The update of one enrichment cell: $set and $unset of cell properties only, so an
// enrichment write can only ever change `_enrich.<columnKey>.<cell property>` paths.
function buildCellUpdate({ columnKey, set = {}, unset = [] }) {
  const update = {};
  const setPaths = {};
  Object.entries(set).forEach(([property, value]) => {
    setPaths[enrichPath({ columnKey, property })] = value;
  });
  const unsetPaths = {};
  unset.forEach((property) => {
    unsetPaths[enrichPath({ columnKey, property })] = '';
  });
  if (Object.keys(setPaths).length > 0) update.$set = setPaths;
  if (Object.keys(unsetPaths).length > 0) update.$unset = unsetPaths;
  return update;
}

export default buildCellUpdate;
