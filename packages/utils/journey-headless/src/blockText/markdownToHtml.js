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

import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// The html a Markdown block draws for `markdown`, as react-markdown draws it with remark-gfm (the
// same micromark and mdast versions): only its elements and text count, so attributes, ids and
// urls are left out. Raw html in the markdown reads as text, as react-markdown shows it without
// rehype-raw, or is left out with skipHtml; with `raw` (DangerousMarkdown, rehype-raw) it is
// drawn as html. Returns { html, open }: open says why the drawn text is not all known (a
// footnote, which remark-gfm draws with a label and back links), else null.
function markdownToHtml({ markdown, raw = false, skipHtml = false }) {
  let open = null;
  function children(node) {
    return (node.children ?? []).map(draw).join('');
  }
  function draw(node) {
    switch (node.type) {
      case 'text':
        return escapeHtml(node.value);
      case 'html':
        if (skipHtml) return '';
        return raw ? node.value : escapeHtml(node.value);
      case 'paragraph':
        return `<p>${children(node)}</p>`;
      case 'heading':
        return `<h${node.depth}>${children(node)}</h${node.depth}>`;
      case 'blockquote':
        return `<blockquote>${children(node)}</blockquote>`;
      case 'list':
        return node.ordered ? `<ol>${children(node)}</ol>` : `<ul>${children(node)}</ul>`;
      case 'listItem':
        return `<li>${node.checked === null || node.checked === undefined ? '' : '<input type="checkbox" disabled> '}${children(node)}</li>`;
      case 'code':
        return `<pre><code>${escapeHtml(node.value)}\n</code></pre>`;
      case 'inlineCode':
        return `<code>${escapeHtml(node.value)}</code>`;
      case 'emphasis':
        return `<em>${children(node)}</em>`;
      case 'strong':
        return `<strong>${children(node)}</strong>`;
      case 'delete':
        return `<del>${children(node)}</del>`;
      case 'link':
      case 'linkReference':
        return `<a>${children(node)}</a>`;
      case 'break':
        return '<br>';
      case 'thematicBreak':
        return '<hr>';
      case 'image':
      case 'imageReference':
        return '<img>';
      case 'table':
        return `<table>${children(node)}</table>`;
      case 'tableRow':
        return `<tr>${children(node)}</tr>`;
      case 'tableCell':
        return `<td>${children(node)}</td>`;
      case 'definition':
        return '';
      case 'footnoteReference':
      case 'footnoteDefinition':
        open = 'remark-gfm draws its footnotes with a label and back links';
        return '';
      default:
        open = `it holds markdown a headless run does not draw (${node.type})`;
        return children(node);
    }
  }
  const tree = fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
  return { html: children(tree), open };
}

export default markdownToHtml;
