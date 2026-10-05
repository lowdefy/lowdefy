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

function shortSha(sha) {
  return sha.slice(0, 7);
}

// The revisions compared, or, on a head-only run (a charter with no PR), the
// head alone.
function revisionLine({ scope, cached }) {
  const pr = scope.pr === null ? '' : `PR #${scope.pr.number}  `;
  const head = `head ${shortSha(scope.head)} (${
    scope.dirty ? 'uncommitted changes included' : 'clean'
  })`;
  const buildSeconds = Math.round(((scope.buildMs.base ?? 0) + (scope.buildMs.head ?? 0)) / 1000);
  if (scope.base === null) {
    return `${pr}${head}, no diff   build ${buildSeconds}s${cached?.head ? ' (cached)' : ''}`;
  }
  return `${pr}base ${shortSha(scope.base)}  ${head}   builds ${buildSeconds}s${
    cached?.base ? ' (base cached)' : ''
  }`;
}

// The scope as the run prints it: the revision line, then the target pages
// with why, the app-wide artifacts that changed, the plugins the base was
// built without or at another version, and the removed pages.
function formatScopeLines({ scope, cached }) {
  const lines = [revisionLine({ scope, cached })];
  const pages = scope.pages.map((page) => `${page.pageId} (${page.reasons.join(', ')})`);
  lines.push(`Scope     ${scope.pages.length} pages: ${pages.join(', ') || 'none'}`);
  if (scope.appWide.length > 0) {
    lines.push(`App-wide  ${scope.appWide.join(', ')} changed`);
  }
  scope.plugins.missingFromHead.forEach((name) => {
    lines.push(`Plugins   the base lists ${name}, which the head does not install`);
  });
  scope.plugins.versionChanged.forEach(({ name, base, head }) => {
    lines.push(
      `Plugins   base built with the head's plugins; ${name} ${base} → ${head} is not in the diff; pass --page to walk pages that use it`
    );
  });
  if (scope.removedPages.length > 0) {
    lines.push(`Removed   ${scope.removedPages.join(', ')} (not walked)`);
  }
  return lines;
}

export default formatScopeLines;
