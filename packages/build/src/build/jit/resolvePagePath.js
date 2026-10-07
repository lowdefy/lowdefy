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

import createPageBuildContext from './createPageBuildContext.js';
import createReadConfigFile from '../../utils/readConfigFile.js';
import prepareJitContext from './prepareJitContext.js';
import resolvePageSource from './resolvePageSource.js';

// The route path a page's source file declares now: its path, scoped to its
// module entry as buildModules scopes it, or its id when it declares none.
// The dev server compares it with routes.json after a page file changes, so
// files are read through a fresh read cache: the kept context's cache holds
// what the skeleton build read. The page's content is skipped, as the skeleton
// build skips it, so a check does not read the files the content refs, and the
// refs it does walk go on copies of refMap and unresolvedRefVars, so checks do
// not grow the kept context's.
async function resolvePagePath({ pageId, pageRegistry, context }) {
  prepareJitContext(context);
  const pageEntry = pageRegistry.get(pageId);
  const buildContext = createPageBuildContext(context);
  buildContext.readConfigFile = createReadConfigFile({ directories: context.directories });
  buildContext.refMap = { ...context.refMap };
  buildContext.unresolvedRefVars = { ...context.unresolvedRefVars };
  const { page } = await resolvePageSource({
    pageId,
    pageEntry,
    buildContext,
    skipContent: true,
  });
  if (type.isUndefined(page.path)) {
    return pageId;
  }
  if (type.isString(page.path) && !type.isNone(pageEntry.moduleEntryId)) {
    return `${pageEntry.moduleEntryId}/${page.path}`;
  }
  return page.path;
}

export default resolvePagePath;
