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

// A picked day as a filter value: `YYYY-MM-DD` for date columns (compared by day), and the start
// or end of that day as an ISO instant for datetime columns, so a range covers whole days.
function formatFilterDate({ column, date, edge }) {
  if (type.isNone(date)) return null;
  if (column.type !== 'datetime') return date.format('YYYY-MM-DD');
  const day = edge === 'end' ? date.endOf('day') : date.startOf('day');
  return day.toISOString();
}

export default formatFilterDate;
