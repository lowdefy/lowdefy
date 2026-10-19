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

import { serializer } from '@lowdefy/helpers';

// routes.json: [{ pageId, path, auth }] for every page, with the page's auth
// so the server can filter patterned pages per caller.
async function writeRoutes({ components, context }) {
  const authByPageId = new Map((components.pages ?? []).map((page) => [page.pageId, page.auth]));
  const routes = context.routes.map(({ pageId, path }) => ({
    pageId,
    path,
    auth: authByPageId.get(pageId),
  }));
  await context.writeBuildArtifact('routes.json', serializer.serializeToString(routes));
}

export default writeRoutes;
