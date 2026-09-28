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

// The rows the view matches: the server's `total` when the data source reports one (server
// mode), else the view's data rows (after filtering, including rows in collapsed groups).
function getRecordCount({ api }) {
  if (type.isNumber(api.total)) return api.total;
  return api.dataRows.length;
}

export default getRecordCount;
