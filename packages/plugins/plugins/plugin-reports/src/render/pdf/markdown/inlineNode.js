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

import { CODE_TEXT, LINK_COLOR } from './constants.js';
import inlineNodes from './inlineNodes.js';
import safeLinkUrl from './safeLinkUrl.js';
import softWrap from './softWrap.js';
import urlOf from './urlOf.js';
import withDecoration from './withDecoration.js';

// Map one inline mdast node to pdfmake text items, carrying the accumulated
// style down so nested marks compose (**_bold italic_** gets both).
function inlineNode(node, style, state) {
  switch (node.type) {
    case 'text':
      return [{ text: softWrap(node.value), ...style }];
    case 'strong':
      return inlineNodes(node.children, { ...style, bold: true }, state);
    case 'emphasis':
      return inlineNodes(node.children, { ...style, italics: true }, state);
    case 'delete':
      return inlineNodes(node.children, withDecoration(style, 'lineThrough'), state);
    case 'inlineCode':
      return [{ text: node.value, ...style, ...CODE_TEXT }];
    case 'link':
    case 'linkReference': {
      const url = safeLinkUrl(urlOf(node, state));
      // A reference with no definition, or an unsafe scheme, is not a link; its
      // text still shows.
      if (url === undefined) return inlineNodes(node.children, style, state);
      return inlineNodes(
        node.children,
        withDecoration({ ...style, link: url, color: LINK_COLOR }, 'underline'),
        state
      );
    }
    case 'break':
      return [{ text: '\n', ...style }];
    case 'image':
    case 'imageReference':
      // An image nested inside other inline content (a linked badge, say) cannot
      // be embedded: pdfmake text arrays hold text only. Its alt text stands in.
      if (type.isString(node.alt) && node.alt !== '') return [{ text: node.alt, ...style }];
      return [];
    case 'html':
      state.htmlNodes += 1;
      return [];
    default:
      // Anything else with children (an inline footnote, a plugin's own node)
      // contributes its text; anything with a raw value contributes that. A node
      // with neither (a definition, a footnoteReference) is invisible, as on the
      // page.
      if (type.isArray(node.children)) return inlineNodes(node.children, style, state);
      if (type.isString(node.value)) return [{ text: softWrap(node.value), ...style }];
      return [];
  }
}

export default inlineNode;
