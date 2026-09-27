#!/usr/bin/env node
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

import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';

import hashDocSources from './hashDocSources.js';

// Second step of `pnpm docs:content`. extractAgentDocs runs inside the docs
// build, which knows each page's ref id but not yet the files behind it; the
// build's refMap.json (written at its end) maps ref ids to files and their
// parents. For each doc this finds the ref that pages.yaml resolved to the page,
// lists that ref's file and every file referenced below it, and records them
// with their hash in index.json. A package.json is read for its version, which
// every release bumps, not for page content, so it is left out: otherwise each
// release and dependency update would mark every doc stale.
function collectSourceFiles({ refMap, entryRefId }) {
  const children = new Map();
  Object.entries(refMap).forEach(([id, ref]) => {
    const siblings = children.get(ref.parent) ?? [];
    siblings.push(id);
    children.set(ref.parent, siblings);
  });
  const files = new Set();
  const queue = [entryRefId];
  while (queue.length > 0) {
    const id = queue.pop();
    const filePath = refMap[id].path;
    if (typeof filePath === 'string' && path.basename(filePath) !== 'package.json') {
      files.add(filePath);
    }
    queue.push(...(children.get(id) ?? []));
  }
  return [...files].sort();
}

function findEntryRef({ refMap, refId, pagesFile }) {
  for (let id = refId; refMap[id] !== undefined; id = refMap[id].parent) {
    if (refMap[refMap[id].parent]?.path === pagesFile) {
      return id;
    }
  }
  throw new Error(`Ref ${refId} is not below ${pagesFile} in the build's refMap.`);
}

function recordSourceHashes({ configDirectory, outputDir, pagesFile, refMapPath }) {
  const refMap = JSON.parse(fs.readFileSync(refMapPath, 'utf8'));
  const indexPath = path.join(outputDir, 'index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const sources = {};
  index.docs.forEach(({ slug }) => {
    const entryRefId = findEntryRef({ refMap, refId: index.sources[slug].refId, pagesFile });
    const files = collectSourceFiles({ refMap, entryRefId });
    sources[slug] = { files, hash: hashDocSources({ configDirectory, files }) };
  });
  fs.writeFileSync(indexPath, JSON.stringify({ ...index, sources }, null, 2));
}

const { values } = parseArgs({
  options: {
    'config-directory': { type: 'string' },
    'pages-file': { type: 'string', default: 'pages.yaml' },
    'ref-map': { type: 'string' },
  },
});

recordSourceHashes({
  configDirectory: path.resolve(values['config-directory']),
  outputDir: path.resolve(dirname(fileURLToPath(import.meta.url)), '..'),
  pagesFile: values['pages-file'],
  refMapPath: path.resolve(values['ref-map']),
});
