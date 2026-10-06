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

function changeSize(page) {
  const blocks = page.blocks.filter(
    (block) => block.change === 'added' || block.change === 'changed'
  ).length;
  const calls = page.reasons.filter(
    (reason) => reason.startsWith('request:') || reason.startsWith('endpoint:')
  ).length;
  return { blocks, calls };
}

const UNCHANGED_REASONS = ['app-wide', 'manual', 'entry', 'charter'];

function isChanged(page) {
  return page.reasons.some((reason) => !UNCHANGED_REASONS.includes(reason));
}

// The order walks visit (page, role) targets in each breadth-first round:
// changed pages by the size of their change (blocks added or changed, then
// requests and endpoints), then the rest (app-wide entry pages, --page and
// charter pages), and within a page its roles in role order. scopePages are
// scope.json's pages; targets are resolveRoles' targets.
function orderTargets({ scopePages, targets }) {
  const rank = new Map(
    [...scopePages]
      .map((page, index) => ({ page, index, size: changeSize(page), changed: isChanged(page) }))
      .sort(
        (a, b) =>
          Number(b.changed) - Number(a.changed) ||
          b.size.blocks - a.size.blocks ||
          b.size.calls - a.size.calls ||
          a.index - b.index
      )
      .map(({ page }, index) => [page.pageId, index])
  );
  return targets
    .map((target, index) => ({ target, index }))
    .sort((a, b) => rank.get(a.target.pageId) - rank.get(b.target.pageId) || a.index - b.index)
    .map(({ target }) => target);
}

export default orderTargets;
