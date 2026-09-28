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

// Every aggregate a column can declare, with the label the summary shows.
const AGGREGATE_LABELS = {
  sum: 'Sum',
  avg: 'Average',
  min: 'Min',
  max: 'Max',
  count: 'Count',
  countDistinct: 'Unique',
  countEmpty: 'Empty',
  countNotEmpty: 'Filled',
  percentEmpty: 'Empty',
  earliest: 'Earliest',
  latest: 'Latest',
};

export default AGGREGATE_LABELS;
