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

import fs from 'node:fs';
import path from 'node:path';

// The first prose paragraph of an extracted docs page: skips the title, blockquotes, headings
// and fenced code so a page that opens with a signature block still yields a sentence.
export function firstParagraph(markdown) {
  const lines = markdown.split('\n');
  let inFence = false;
  let paragraph = [];
  for (const line of lines) {
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const trimmed = line.trim();
    if (trimmed === '') {
      if (paragraph.length > 0) break;
      continue;
    }
    if (paragraph.length === 0 && (trimmed.startsWith('#') || trimmed.startsWith('>'))) {
      continue;
    }
    paragraph.push(trimmed);
  }
  return paragraph.join(' ');
}

// Reads @lowdefy/docs-content and returns resolveDoc(slug) -> { slug, title, firstParagraph },
// or null for a slug the index does not know.
function createDocsResolver({ docsContentDirectory }) {
  const index = JSON.parse(fs.readFileSync(path.join(docsContentDirectory, 'index.json'), 'utf8'));
  const bySlug = new Map(index.docs.map((doc) => [doc.slug, doc]));
  return function resolveDoc(slug) {
    const doc = bySlug.get(slug);
    if (doc === undefined) {
      return null;
    }
    const markdown = fs.readFileSync(path.join(docsContentDirectory, doc.path), 'utf8');
    return { slug, title: doc.title, firstParagraph: firstParagraph(markdown) };
  };
}

export default createDocsResolver;
