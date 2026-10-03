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

function describeMutation({ mutation }) {
  if (type.isNone(mutation)) return 'no mutation report yet';
  const parts = [`${mutation.killed}/${mutation.total} mutants`];
  if (type.isInt(mutation.unique)) parts.push(`${mutation.unique} only this journey kills`);
  return parts.join(' · ');
}

// The journeys no production session in the window backs, each beside its
// mutation numbers, for the developer to judge. Nothing is removed: a 30-day
// window cannot see quarterly or yearly work, and a journey that is the only
// one to kill a mutant matters whatever its traffic. Empty when every journey
// is backed.
function formatZeroBacked({ results, window }) {
  const unbacked = results.filter((result) => result.after.production?.sessions === 0);
  if (unbacked.length === 0) return [];
  const width = Math.max(...unbacked.map((result) => result.name.length));
  return [
    `No production backing in ${window.from}/${window.to} (nothing is removed):`,
    ...unbacked.map(
      (result) =>
        `  ${result.name.padEnd(width)}  0 sessions · ${describeMutation({
          mutation: result.after.mutation,
        })}`
    ),
    'A 30-day window cannot see quarterly or yearly work. A journey that is the only one to kill a mutant is load-bearing whatever its traffic.',
  ];
}

export default formatZeroBacked;
