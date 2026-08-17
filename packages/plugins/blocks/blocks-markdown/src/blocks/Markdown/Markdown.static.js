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

/**
 * The three markdown blocks all render the same thing in a report: their
 * evaluated `content` as a `markdown` IR node. `@lowdefy/plugin-reports` owns
 * the translation (remark-parse + remark-gfm — the parser family react-markdown
 * uses on the client, so parsing agrees), which is why the renderer emits the
 * markdown source and never a parsed tree.
 *
 * The client differences between the three blocks do not survive into a
 * document: `MarkdownWithCode` syntax-highlights fenced code (a report renders
 * code in one code style), and `DangerousMarkdown` renders sanitised raw HTML
 * (the report translator ignores raw HTML and logs a warning — custom HTML
 * belongs in the Html block). The markdown structure itself renders identically
 * for all three.
 */

/** True when the content would render nothing. */
function isBlank(content) {
  return content === null || content === undefined || content === '';
}

function toMarkdownNode({ block }) {
  const { content } = block.properties;
  if (isBlank(content)) return null;
  return { kind: 'markdown', markdown: String(content) };
}

/** Markdown → `markdown`. Empty content yields no node. */
export const Markdown = { toReport: toMarkdownNode };

/** MarkdownWithCode → `markdown`; fenced code renders in the report code style. */
export const MarkdownWithCode = { toReport: toMarkdownNode };

/** DangerousMarkdown → `markdown`; embedded raw HTML is ignored on translation. */
export const DangerousMarkdown = { toReport: toMarkdownNode };
