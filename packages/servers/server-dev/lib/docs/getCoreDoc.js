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
import getHazards from './getHazards.js';

function findDoc({ manifest, slug, kind, typeName }) {
  if (!type.isNone(slug)) {
    return manifest.docs.find((doc) => doc.slug === slug) ?? null;
  }
  if (type.isNone(typeName)) {
    return null;
  }
  let singularKind = type.isNone(kind) ? null : String(kind).toLowerCase().replace(/s$/, '');
  // Requests are documented on their connection's page (e.g. MongoDBFind → MongoDB).
  if (singularKind === 'request') {
    singularKind = 'connection';
  }
  const candidates = manifest.docs.filter(
    (doc) => doc.typeName && (type.isNone(singularKind) || doc.kind === singularKind)
  );
  const exact = candidates.find((doc) => doc.typeName === typeName);
  if (exact) {
    return exact;
  }
  // Connection docs are titled per package (e.g. "MongoDB" covers
  // MongoDBCollection and all MongoDB requests) — fall back to prefix match.
  const prefixed = candidates
    .filter((doc) => typeName.startsWith(doc.typeName))
    .sort((a, b) => b.typeName.length - a.typeName.length);
  return prefixed[0] ?? null;
}

function getCoreDoc({ slug, kind, type: typeName }) {
  const manifest = getDocsManifest();
  if (type.isNone(manifest)) {
    return null;
  }
  const doc = findDoc({ manifest, slug, kind, typeName });
  if (type.isNone(doc)) {
    return null;
  }
  const markdown = fs.readFileSync(path.join(manifest.contentDir, doc.path), 'utf8');
  const result = { slug: doc.slug, title: doc.title, section: doc.section, markdown };
  // Hazards belong to the type the caller asked about, not to the doc page:
  // findDoc remaps requests onto their connection's page, and a request must
  // carry its own hazards rather than inherit the connection's. A slug lookup
  // names no type, so the page's own kind and typeName from the manifest are
  // the type it is about.
  const hazardType = type.isNone(slug)
    ? { kind, typeName }
    : { kind: doc.kind, typeName: doc.typeName };
  if (!type.isNone(hazardType.typeName)) {
    result.hazards = getHazards({ kind: hazardType.kind, type: hazardType.typeName });
  }
  return result;
}

export default getCoreDoc;
