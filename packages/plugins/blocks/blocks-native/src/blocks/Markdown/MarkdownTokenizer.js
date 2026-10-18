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

// react-native-marked draws no checkbox token, so a GFM task list item would lose its box. The
// box is put in front of the item's text instead, as a ballot box character.
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
      const box = item.checked ? '☑ ' : '☐ ';
      const text = item.tokens.find((child) => child.type === 'text' || child.type === 'paragraph');
      text?.tokens.unshift({ type: 'text', raw: box, text: box });
    });
    return token;
  }
}

export default MarkdownTokenizer;
