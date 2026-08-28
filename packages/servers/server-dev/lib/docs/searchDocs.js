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
import { type } from '@lowdefy/helpers';

import getDocsManifest from './getDocsManifest.js';

const MAX_RESULTS = 20;
const SNIPPET_RADIUS = 120;

let contentCache = null;

function getContents({ manifest }) {
  if (contentCache !== null) {
    return contentCache;
  }
  contentCache = manifest.docs.map((doc) => ({
    doc,
    content: fs.readFileSync(path.join(manifest.contentDir, doc.path), 'utf8'),
  }));
  return contentCache;
}

function searchDocs({ query }) {
  if (!type.isString(query) || query.trim() === '') {
    throw new Error('searchDocs requires a "query" string.');
  }
  const manifest = getDocsManifest();
  if (type.isNone(manifest)) {
    return [];
  }
  const lowerQuery = query.trim().toLowerCase();
  const titleMatches = [];
  const contentMatches = [];
  for (const { doc, content } of getContents({ manifest })) {
    if (doc.title.toLowerCase().includes(lowerQuery) || doc.slug.includes(lowerQuery)) {
      titleMatches.push({ ...doc, snippet: content.slice(0, SNIPPET_RADIUS * 2) });
      continue;
    }
    const index = content.toLowerCase().indexOf(lowerQuery);
    if (index !== -1) {
      const start = Math.max(0, index - SNIPPET_RADIUS);
      contentMatches.push({
        ...doc,
        snippet: content.slice(start, index + lowerQuery.length + SNIPPET_RADIUS),
      });
    }
  }
  return [...titleMatches, ...contentMatches].slice(0, MAX_RESULTS);
}

export default searchDocs;
