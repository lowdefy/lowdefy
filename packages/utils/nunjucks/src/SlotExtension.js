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

import nunjucks from 'nunjucks';

// {% slot "name" %} renders a marker element that a block (Template) later fills with a React
// portal holding real Lowdefy blocks. The tag has no body and no end tag. The node classes must
// come from the same nunjucks instance as the environment, which is why this lives here.
class SlotExtension {
  constructor() {
    this.tags = ['slot'];
  }

  parse(parser, nodes) {
    const tagToken = parser.nextToken();
    const nameToken = parser.peekToken();
    if (nameToken.type !== 'string') {
      parser.fail(
        'slot tag expects a quoted slot name, for example {% slot "footer" %}.',
        nameToken.lineno,
        nameToken.colno
      );
    }
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tagToken.value);
    return new nodes.CallExtension(this, 'run', args);
  }

  run(_context, name) {
    // "<" must be escaped along with "&" and quote: the marker is emitted as a
    // SafeString and then passed through DOMPurify, which would reinterpret an
    // unescaped "<" in the name as the start of a tag.
    const escaped = String(name)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
    return new nunjucks.runtime.SafeString(`<div data-ldf-slot="${escaped}"></div>`);
  }
}

export default SlotExtension;
