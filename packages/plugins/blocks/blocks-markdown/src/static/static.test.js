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

import { validateNode } from '../../../../../reports/src/ir/nodes.js';
import { Markdown, MarkdownWithCode, DangerousMarkdown } from './index.js';

// Call a renderer with a `propertiesEval.output`-shaped block projection and
// validate every node it returns against the closed IR validator.
function run(renderer, { properties = {}, children, layout = {}, context = {} } = {}) {
  const result = renderer.toReport({
    block: { id: 'b', blockId: 'b', type: 'X', properties },
    children,
    layout,
    context,
  });
  const nodes = result == null ? [] : Array.isArray(result) ? result : [result];
  nodes.forEach((node) => validateNode(node));
  return result;
}

describe.each([
  ['Markdown', Markdown],
  ['MarkdownWithCode', MarkdownWithCode],
  ['DangerousMarkdown', DangerousMarkdown],
])('%s', (_name, renderer) => {
  test('maps content to a markdown node', () => {
    expect(run(renderer, { properties: { content: '# Title\n\nBody' } })).toEqual({
      kind: 'markdown',
      markdown: '# Title\n\nBody',
    });
  });

  test('stringifies non-string content', () => {
    expect(run(renderer, { properties: { content: 42 } })).toEqual({
      kind: 'markdown',
      markdown: '42',
    });
  });

  test('returns null for empty content', () => {
    expect(run(renderer, { properties: {} })).toBeNull();
    expect(run(renderer, { properties: { content: '' } })).toBeNull();
    expect(run(renderer, { properties: { content: null } })).toBeNull();
  });
});
