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

import { buildPagePath } from '@lowdefy/helpers';

// The path (no leading "/", no basePath) of the home page: the configured
// homePageId, or the first menu link the user may see with its pathParams.
// The pattern comes from the route table, which lists every page whatever the
// caller may open.
async function getHomePath({ context, home }) {
  const routes = await context.readConfigFile('routes.json');
  const route = routes.find(({ pageId }) => pageId === home.pageId);
  return buildPagePath({ pageId: home.pageId, path: route?.path, pathParams: home.pathParams });
}

export default getHomePath;
