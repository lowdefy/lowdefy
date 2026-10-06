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

import isCountedFlow from './isCountedFlow.js';
import reconcileFlows from './reconcileFlows.js';

// The cached months a refresh has to read: those where some counted flow
// (live or deprecated) has no entry, or holds fewer final days than the
// cache, plus every cached month for a live flow rehashed under a new
// matcher. Every other month would merge to what is committed. A routine
// refresh reads the current month, and the previous one across a boundary.
//
// - journeys: the committed journeys.
// - dayCounts: { 'YYYY-MM': final days cached }.
// - routeTable, isConfigText: the build's route table and the app's config
//   text rule, as reconcileFlows reads them.
function selectMonthsToRead({ journeys, dayCounts, today, routeTable, isConfigText }) {
  const months = new Set();
  journeys.forEach((journey) => {
    const { live, deprecated, recount } = reconcileFlows({
      journey,
      today,
      routeTable,
      isConfigText,
    });
    [live, ...deprecated.filter((entry) => isCountedFlow({ entry }))].forEach((entry) => {
      const days = new Map(entry.months.map((month) => [month.month, month.days]));
      Object.keys(dayCounts).forEach((month) => {
        const recounted = recount && entry === live;
        if (recounted || !days.has(month) || days.get(month) < dayCounts[month]) {
          months.add(month);
        }
      });
    });
  });
  return [...months].sort();
}

export default selectMonthsToRead;
