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

import YAML from 'yaml';
import { type } from '@lowdefy/helpers';

import buildOriginComment from './buildOriginComment.js';
import commentText from './commentText.js';

// The document API rather than `YAML.stringify`, because the comments are half
// the output: the origin block above the journey says where the candidate came
// from, and a comment above a step names the recorded event that produced no
// step at all. A plain stringify would drop both.
function renderCandidate({ comments, footer, journey, origin }) {
  const doc = new YAML.Document(journey, { lineWidth: 0 });
  doc.commentBefore = buildOriginComment({ origin });

  const steps = doc.get('steps');
  (comments ?? new Map()).forEach((comment, index) => {
    const item = steps.items[index];
    if (type.isNone(item)) return;
    item.commentBefore = commentText({ lines: comment.split('\n') });
  });
  // Events recorded after the last step have no step to sit above, so they end
  // the file instead of being lost.
  if (!type.isUndefined(footer)) doc.comment = commentText({ lines: footer.split('\n') });

  return doc.toString({ lineWidth: 0 });
}

export default renderCandidate;
