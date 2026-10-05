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
import path from 'path';
import { resolvePagePath } from '@lowdefy/build/dev';

// Whether a changed page file now declares a path other than the one its page
// has in routes.json (adding or removing a path included). Page files are not
// skeleton sources, so without this the old URL would keep matching and the
// new one would 404 until the config is rebuilt.
async function pagePathChanged({ changedFiles, context }) {
  const changed = new Set(changedFiles);
  const pageIds = [...context.pageRegistry.values()]
    .filter((pageEntry) => changed.has(pageEntry.refPath))
    .map((pageEntry) => pageEntry.pageId);
  if (pageIds.length === 0) {
    return false;
  }
  const routes = JSON.parse(
    fs.readFileSync(path.join(context.directories.build, 'routes.json'), 'utf8')
  );
  const routePaths = new Map(routes.map((route) => [route.pageId, route.path]));
  for (const pageId of pageIds) {
    let pagePath;
    try {
      pagePath = await resolvePagePath({
        pageId,
        pageRegistry: context.pageRegistry,
        context: context.buildContext,
      });
    } catch {
      // A page file that does not resolve is reported by its page build.
      continue;
    }
    if (pagePath !== routePaths.get(pageId)) {
      return true;
    }
  }
  return false;
}

export default pagePathChanged;
