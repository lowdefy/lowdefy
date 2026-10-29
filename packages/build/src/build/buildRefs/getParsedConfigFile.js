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

import cloneWithMarkers from './cloneWithMarkers.js';
import parseRefContent from './parseRefContent.js';

// A file referenced from many places is parsed once per build context. The
// walker mutates what a ref returns (_var substitution, nested refs, ~r
// stamping, ~ignoreBuildChecks), so every caller, the first included, gets its
// own copy and the cached tree is never handed out.
//
// An entry is keyed by path and checked by content: the dev server keeps its
// context across edits and swaps in only a fresh read cache, so an edited file
// arrives with new content and is parsed again. Only a tree that parsed and
// passed the reserved key check is stored, so a bad file throws at every ref.
async function getParsedConfigFile({ context, content, refDef }) {
  const entry = context.parsedConfigCache.get(refDef.path);
  if (entry?.content === content) {
    return cloneWithMarkers(entry.parsed);
  }
  const parsed = await parseRefContent({ content, refDef });
  context.parsedConfigCache.set(refDef.path, { content, parsed });
  return cloneWithMarkers(parsed);
}

export default getParsedConfigFile;
