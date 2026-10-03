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

import buildOriginComment from './buildOriginComment.js';
import findOriginBlock from './findOriginBlock.js';

// A known candidate is never recompiled in place. A rerun that recognises the
// sequence hash rewrites the origin block and nothing else, so a name, a filled
// value, a removed step or a comment someone left in the file survives the run.
// The old block is cut by text rather than through the yaml document because
// yaml attaches a leading comment to the first key, not the document, as soon
// as a developer's comment sits straight above it or the blank line after the
// block is gone; replacing `doc.commentBefore` then stacked a new block on top.
function updateCandidateOrigin({ contents, origin }) {
  const lines = contents.split('\n');
  const block = findOriginBlock({ lines });
  const rest = type.isUndefined(block)
    ? lines
    : [...lines.slice(0, block.start), ...lines.slice(block.end)];
  const originLines = buildOriginComment({ origin })
    .split('\n')
    .map((line) => (line === '' ? '' : `#${line}`));
  return [...originLines, '', ...rest].join('\n');
}

export default updateCandidateOrigin;
