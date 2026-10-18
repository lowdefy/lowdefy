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

import { MarkedTokenizer } from 'react-native-marked';

// The text a task item's box stands as: MarkdownRenderer draws it as a TaskMark, which has the
// item draw the box where its marker goes.
export const TASK_OPEN = '☐';
export const TASK_DONE = '☑';

// react-native-marked draws no checkbox token, so a GFM task list item would lose its box. A mark
// token is put in front of the item's text instead.
class MarkdownTokenizer extends MarkedTokenizer {
  list(src) {
    const token = super.list(src);
    if (!token) {
      return token;
    }
    token.items.forEach((item) => {
      if (!item.task) {
        return;
      }
      const mark = item.checked ? TASK_DONE : TASK_OPEN;
      const text = item.tokens.find((child) => child.type === 'text' || child.type === 'paragraph');
      text?.tokens.unshift({ type: 'text', raw: mark, text: mark });
    });
    return token;
  }
}

export default MarkdownTokenizer;
