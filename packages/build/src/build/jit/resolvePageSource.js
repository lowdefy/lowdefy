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
import { ConfigError } from '@lowdefy/errors';

import isPageContentPath from './isPageContentPath.js';
import resolveSourceFile from './resolveSourceFile.js';

// Resolves one page's config from its source file, as the full build's ref
// walk would: vars, refs, transformer and static operators, with a module
// page's id scoped to its entry.
// With skipContent, the page's content keys are dropped unwalked, as the
// skeleton build drops them, so the files they ref are not read and the other
// keys (id, path, auth) resolve as they do for routes.json.
async function resolvePageSource({ pageId, pageEntry, buildContext, skipContent = false }) {
  let shouldStop = null;
  if (skipContent) {
    // Walker paths here start at the page file; the skeleton's start at the
    // pages array in lowdefy.yaml.
    shouldStop = (jsonPath) => isPageContentPath(`pages.${jsonPath}`);
  }
  const { content, moduleEntry, refDef } = await resolveSourceFile({
    entry: pageEntry,
    buildContext,
    label: `Page "${pageId}"`,
    shouldStop,
  });
  let processed = content;

  // When resolving from a collection file (with vars), the result is an array of pages.
  // Find the specific page by ID. For module pages, source IDs are unscoped.
  if (type.isArray(processed)) {
    const unscopedId = moduleEntry ? pageId.slice(`${moduleEntry.id}/`.length) : pageId;
    processed = processed.find((p) => type.isObject(p) && p.id === unscopedId);
    if (!processed) {
      throw new ConfigError(`Page "${pageId}" not found in resolved page source file.`, {
        filePath: pageEntry.refPath,
      });
    }
  }

  // JIT builds resolve from source YAML — the page ID is unscoped for module pages
  if (moduleEntry && type.isObject(processed) && processed.id) {
    processed.id = `${moduleEntry.id}/${processed.id}`;
  }

  return { page: processed, refDef };
}

export default resolvePageSource;
