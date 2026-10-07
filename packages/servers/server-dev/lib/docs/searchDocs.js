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

import docSources from './docSources.js';
import getDocsIndex from './getDocsIndex.js';
import readDocEntry from './readDocEntry.js';
import splitSearchTerms from './splitSearchTerms.js';

const MAX_RESULTS = 20;
const SNIPPET_RADIUS = 120;
const TITLE_WEIGHT = 3;
const TYPE_NAME_WEIGHT = 2;
const BODY_WEIGHT = 1;

// Each term counts once, in the best field it appears in.
function scoreEntry({ entry, content, terms }) {
  const title = entry.title.toLowerCase();
  const slug = entry.slug.toLowerCase();
  const typeName = (entry.typeName ?? '').toLowerCase();
  const body = content.toLowerCase();
  let score = 0;
  let titleMatched = false;
  let bodyMatch = null;
  for (const term of terms) {
    if (title.includes(term) || slug.includes(term)) {
      score += TITLE_WEIGHT;
      titleMatched = true;
      continue;
    }
    if (typeName.includes(term)) {
      score += TYPE_NAME_WEIGHT;
      continue;
    }
    const index = body.indexOf(term);
    if (index !== -1) {
      score += BODY_WEIGHT;
      bodyMatch = bodyMatch ?? { index, term };
    }
  }
  return { score, titleMatched, bodyMatch };
}

function makeSnippet({ content, titleMatched, bodyMatch }) {
  if (titleMatched || type.isNone(bodyMatch)) {
    return content.slice(0, SNIPPET_RADIUS * 2);
  }
  const start = Math.max(0, bodyMatch.index - SNIPPET_RADIUS);
  return content.slice(start, bodyMatch.index + bodyMatch.term.length + SNIPPET_RADIUS);
}

function makeHit({ entry, snippet }) {
  const hit = { slug: entry.slug, title: entry.title, section: entry.section };
  if (!type.isNone(entry.kind)) {
    hit.kind = entry.kind;
  }
  if (!type.isNone(entry.typeName)) {
    hit.typeName = entry.typeName;
  }
  hit.source = entry.source;
  hit.package = entry.package;
  hit.version = entry.version;
  hit.path = entry.path ?? entry.filePath;
  hit.snippet = snippet;
  return hit;
}

function searchDocs({ query, source }) {
  if (!type.isString(query) || query.trim() === '') {
    throw new Error('searchDocs requires a "query" string.');
  }
  if (!type.isNone(source) && !docSources.includes(source)) {
    throw new Error(
      `Unknown docs source. Received ${JSON.stringify(source)}. Use one of: ${docSources.join(
        ', '
      )}.`
    );
  }
  let terms = splitSearchTerms({ query });
  // A query of only short or common words, such as "to a", is searched whole.
  if (terms.length === 0) {
    terms = [query.trim().toLowerCase()];
  }
  const { entries } = getDocsIndex();
  const scored = [];
  for (const entry of entries) {
    if (!type.isNone(source) && entry.source !== source) {
      continue;
    }
    const content = readDocEntry({ entry });
    const { score, titleMatched, bodyMatch } = scoreEntry({ entry, content, terms });
    if (score === 0) {
      continue;
    }
    scored.push({
      score,
      hit: makeHit({ entry, snippet: makeSnippet({ content, titleMatched, bodyMatch }) }),
    });
  }
  // Array sort is stable, so entries with equal scores keep index order.
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, MAX_RESULTS).map(({ hit }) => hit);
}

export default searchDocs;
