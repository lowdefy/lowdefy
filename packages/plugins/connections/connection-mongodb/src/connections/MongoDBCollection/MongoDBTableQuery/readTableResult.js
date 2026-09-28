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

import readAggregates from './readAggregates.js';

// The response contract the Table block reads in server mode:
// { rows, total, groups?, aggregates? }. total counts the groups when a group level is
// returned, and the rows otherwise.
function readTableResult({ result, grouped, specs }) {
  const [facet] = result;
  const response = {
    rows: grouped ? [] : facet.rows,
    total: facet.total[0]?.count ?? 0,
  };
  if (grouped) {
    response.groups = facet.groups.map((doc) => ({
      key: doc._id,
      count: doc.count,
      aggregates: readAggregates({ doc, specs }),
    }));
  }
  if (specs.length > 0) {
    response.aggregates = readAggregates({ doc: facet.aggregates[0], specs });
  }
  return response;
}

export default readTableResult;
