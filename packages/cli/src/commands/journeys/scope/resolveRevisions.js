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

import runGit from './runGit.js';

// The two revisions the scope compares. The head is the working tree of this
// checkout, uncommitted changes included (dirty). The base is the merge base
// of HEAD with --base (a branch or commit, such as the pull request's base
// branch). Without --base there is no base: the scope builds the head alone.
async function resolveRevisions({ base, cwd }) {
  const root = await runGit({ args: ['rev-parse', '--show-toplevel'], cwd });
  const head = await runGit({ args: ['rev-parse', 'HEAD'], cwd });
  const status = await runGit({ args: ['status', '--porcelain'], cwd: root });
  const dirty = status !== '';
  if (type.isNone(base)) {
    return { root, head, dirty, base: null };
  }
  // --end-of-options: a ref that starts with a dash is read as a ref, never
  // as a git option.
  const mergeBase = await runGit({ args: ['merge-base', '--end-of-options', base, 'HEAD'], cwd });
  return { root, head, dirty, base: mergeBase };
}

export default resolveRevisions;
