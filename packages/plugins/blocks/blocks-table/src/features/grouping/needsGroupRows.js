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

import someColumnConfig from '../../core/someColumnConfig.js';

// The group rows load when a column can be grouped by: `view.group` only takes groupable columns.
function needsGroupRows({ properties }) {
  return someColumnConfig({ properties, test: (column) => column.groupable === true });
}

export default needsGroupRows;
