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

import resolveDynamicContent from './dynamic/resolveDynamicContent.js';

async function getPageConfig(context, { pageId, urlQuery }) {
  const pageConfig = await context.readConfigFile(`pages/${pageId}.json`);
  if (pageConfig && context.authorize(pageConfig)) {
    // eslint-disable-next-line no-unused-vars
    const { auth, ...rest } = pageConfig;
    if (rest.dynamic !== true) {
      // Use serializer.serialize to ensure ~k keys (non-enumerable after deserialize)
      // are made enumerable again for JSON transfer to client
      return serializer.serialize(rest);
    }
    // readConfigFile caches parsed artifacts — deep copy before resolution so
    // one request's resolved content never reaches another via the cache.
    const resolved = await resolveDynamicContent(context, {
      pageConfig: serializer.copy(rest),
      urlQuery,
    });
    return serializer.serialize(resolved);
  }
  return null;
}

export default getPageConfig;
