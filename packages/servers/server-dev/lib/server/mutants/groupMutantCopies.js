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

import { stableStringify } from '@lowdefy/helpers';

function copyPage(mutant) {
  return mutant.anchor.pageId ?? mutant.artifact;
}

// A `_ref`'d layout, menu or template is copied into every page artifact that
// uses it, so one written node is enumerated once per page. Mutants with the
// same operator, source, arg and target content are one mutant: the copy on
// the first page by page id is kept, and the other pages are listed under
// `copies`. Each other copy's own artifact, key and anchor are listed under
// `copyTargets`, in the same order: the build keys every copy apart, so a
// journey that reaches the node on another page is run against that page's
// copy. Templated copies whose content differs stay apart.
function groupMutantCopies({ mutants }) {
  const groups = new Map();
  mutants.forEach((mutant) => {
    const group = stableStringify([mutant.operator, mutant.source, mutant.arg, mutant.nodeHash]);
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group).push(mutant);
  });
  return [...groups.values()].map((group) => {
    const [kept, ...others] = [...group].sort((a, b) => copyPage(a).localeCompare(copyPage(b)));
    return {
      ...kept,
      copies: others.map(copyPage),
      copyTargets: others.map(({ artifact, key, anchor }) => ({ artifact, key, anchor })),
    };
  });
}

export default groupMutantCopies;
