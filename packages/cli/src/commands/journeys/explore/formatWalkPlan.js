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

const STEP_SECONDS = 2;

function plural({ count, word }) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// The line a run prints before it starts: the most it could do, what that
// would take at about 2 s a step plus the walk overhead (estimated until the
// run measures it), against the budget.
function formatWalkPlan({ targets, walks, steps, budgetMs, walkOverheadMs }) {
  const pages = new Set(targets.map((target) => target.pageId)).size;
  const walkCount = targets.length * walks;
  const maxSteps = walkCount * steps;
  const minutes = Math.ceil((maxSteps * STEP_SECONDS + (walkCount * walkOverheadMs) / 1000) / 60);
  const overhead = Math.round(walkOverheadMs / 1000);
  return `${plural({ count: pages, word: 'page' })}, ${plural({
    count: targets.length,
    word: '(page, role) target',
  })} × ${plural({ count: walks, word: 'walk' })} × ${plural({
    count: steps,
    word: 'step',
  })} = ${maxSteps} steps at most; at ~${STEP_SECONDS} s a step plus ~${overhead} s to open and close each of ${walkCount} walks, that is ~${minutes} min; budget ${Math.round(
    budgetMs / 60000
  )} min, breadth-first.`;
}

export default formatWalkPlan;
