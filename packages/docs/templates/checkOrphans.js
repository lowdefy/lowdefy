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

// Pages that intentionally live in no menu.
const allowlist = new Set(['404']);

// Every page must appear in exactly one menu: zero menus makes it unreachable
// from the sidebar, two or more makes its top tab ambiguous. Dangling menu
// links (a link whose pageId has no page) are only a warning in the Lowdefy
// build — the resulting orphan page is what fails here.
function checkOrphans({ pages, membershipCounts }) {
  const problems = [];
  pages.filter(Boolean).forEach((page) => {
    if (allowlist.has(page.id)) return;
    const count = membershipCounts.get(page.id) ?? 0;
    if (count === 0) {
      problems.push(`Page "${page.id}" does not appear in any menu.`);
    }
    if (count > 1) {
      problems.push(`Page "${page.id}" appears in ${count} menus — its top tab is ambiguous.`);
    }
  });
  if (problems.length > 0) {
    throw new Error(`checkOrphans failed:\n${problems.join('\n')}`);
  }
}

export default checkOrphans;
