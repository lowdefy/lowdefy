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

import getCoreDoc from './getCoreDoc.js';
import getDocsIndex from './getDocsIndex.js';
import readDocEntry from './readDocEntry.js';

function singularKind({ kind }) {
  return type.isNone(kind) ? null : String(kind).toLowerCase().replace(/s$/, '');
}

function findTypeSlug({ typeDocs, kind, typeName, anyKind }) {
  const exactKind = singularKind({ kind });
  if (!type.isNone(exactKind) && typeDocs.has(`${exactKind}:${typeName}`)) {
    return typeDocs.get(`${exactKind}:${typeName}`);
  }
  if (!type.isNone(exactKind) && !anyKind) {
    return null;
  }
  for (const [key, slug] of typeDocs) {
    if (key.slice(key.indexOf(':') + 1) === typeName) {
      return slug;
    }
  }
  return null;
}

// With no kind, a core page for exactly this type name belongs to a Lowdefy
// type, unless a plugin registers the name in that same kind and so replaces
// it. A plugin type of another kind must not take that page's place.
function namesOtherCoreType({ entries, typeDocs, kind, typeName }) {
  if (!type.isNone(kind)) {
    return false;
  }
  return entries.some(
    (entry) =>
      entry.source === 'core' &&
      entry.typeName === typeName &&
      !typeDocs.has(`${entry.kind}:${typeName}`)
  );
}

function makePluginDoc({ entries, slug }) {
  const entry = entries.find((item) => item.source !== 'core' && item.slug === slug);
  if (type.isUndefined(entry)) {
    return null;
  }
  return {
    slug: entry.slug,
    title: entry.title,
    section: entry.section,
    source: entry.source,
    package: entry.package,
    version: entry.version,
    markdown: readDocEntry({ entry }),
  };
}

// A doc page by slug or by type: the core docs, and the docs the app's own
// plugins and modules ship. A type a plugin registers is looked up in its
// plugin's docs before the core docs, whose type lookup falls back to a
// prefix match (MongoDB covers MongoDBFind) that would claim a plugin type
// named like a core one. Plugin types the caller names under another kind
// (the kinds get_doc takes do not cover every kind) come last.
function getDoc({ slug, kind, type: typeName }) {
  const { entries, typeDocs } = getDocsIndex();
  if (!type.isNone(slug)) {
    return getCoreDoc({ slug }) ?? makePluginDoc({ entries, slug });
  }
  if (type.isNone(typeName)) {
    return null;
  }
  const pluginSlug = findTypeSlug({ typeDocs, kind, typeName, anyKind: false });
  if (!type.isNone(pluginSlug) && !namesOtherCoreType({ entries, typeDocs, kind, typeName })) {
    return makePluginDoc({ entries, slug: pluginSlug });
  }
  const coreDoc = getCoreDoc({ kind, type: typeName });
  if (!type.isNone(coreDoc)) {
    return coreDoc;
  }
  const otherKindSlug = findTypeSlug({ typeDocs, kind, typeName, anyKind: true });
  return type.isNone(otherKindSlug) ? null : makePluginDoc({ entries, slug: otherKindSlug });
}

export default getDoc;
