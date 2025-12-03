/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { getFileExtension } from '@lowdefy/node-utils';

import getConfigFile from './getConfigFile.js';
import parseRefContent from './parseRefContent.js';
import runRefResolver from './runRefResolver.js';

function getCacheKey(refDef) {
  const { path, vars } = refDef;
  // For nunjucks files, vars affect the output, so include them in the cache key
  const ext = getFileExtension(path);
  if (ext === 'njk' && vars) {
    return `${path}::${JSON.stringify(vars)}`;
  }
  return path;
}

async function getRefContent({ context, refDef, referencedFrom }) {
  // Skip caching for resolver-based refs (dynamic content)
  if (refDef.resolver || context.refResolver) {
    const content = await runRefResolver({ context, refDef, referencedFrom });
    return parseRefContent({ content, refDef });
  }

  const cacheKey = getCacheKey(refDef);
  const cached = context.parsedContentCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const rawContent = await getConfigFile({ context, refDef, referencedFrom });
  const parsed = parseRefContent({ content: rawContent, refDef });

  context.parsedContentCache.set(cacheKey, parsed);
  return parsed;
}

export default getRefContent;
