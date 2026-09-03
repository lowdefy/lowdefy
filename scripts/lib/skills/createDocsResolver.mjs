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

// Reads @lowdefy/docs-content and returns resolveDoc(slug) -> { slug, title }, or null for a slug
// the index does not know. The page itself is read so that an index entry pointing at a file that
// was not extracted fails the generator rather than shipping a dead pointer into a skill.
function createDocsResolver({ docsContentDirectory }) {
  const index = JSON.parse(fs.readFileSync(path.join(docsContentDirectory, 'index.json'), 'utf8'));
  const bySlug = new Map(index.docs.map((doc) => [doc.slug, doc]));
  return function resolveDoc(slug) {
    const doc = bySlug.get(slug);
    if (doc === undefined) {
      return null;
    }
    fs.readFileSync(path.join(docsContentDirectory, doc.path), 'utf8');
    return { slug, title: doc.title };
  };
}

export default createDocsResolver;
