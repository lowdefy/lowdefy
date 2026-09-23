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

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

// remark-parse with GFM is the parser family react-markdown runs on the client,
// so a document and the live page agree on what the markdown means. Frozen once:
// parse is called per markdown node and a frozen processor is reusable.
const processor = unified().use(remarkParse).use(remarkGfm).freeze();

function parseMarkdown(markdown) {
  return processor.parse(String(markdown ?? ''));
}

export default parseMarkdown;
