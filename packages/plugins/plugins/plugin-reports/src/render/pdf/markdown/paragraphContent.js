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

import { PARAGRAPH_MARGIN } from './constants.js';
import imageContent from './imageContent.js';
import inlineNode from './inlineNode.js';
import textContent from './textContent.js';

// Images cannot live inside a pdfmake text array, so a paragraph mixing prose
// and images splits into alternating text and image nodes. Inside a list item
// the bottom margin is dropped because the list supplies the spacing.
function paragraphContent(node, state) {
  const out = [];
  let run = [];
  const extra = state.listDepth > 0 ? {} : { margin: PARAGRAPH_MARGIN };
  const flush = () => {
    if (run.length === 0) return;
    out.push(textContent(run, extra));
    run = [];
  };
  (node.children ?? []).forEach((child) => {
    if (child.type === 'image' || child.type === 'imageReference') {
      flush();
      out.push(...imageContent(child, state));
      return;
    }
    run.push(...inlineNode(child, {}, state));
  });
  flush();
  return out;
}

export default paragraphContent;
