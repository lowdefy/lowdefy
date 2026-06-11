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

import { getPageConfig } from '@lowdefy/api';

import buildPageIfNeeded from '../../lib/server/jitPageBuilder.js';
import getPathSegments from '../lib/getPathSegments.js';

// JIT page build + config response. The response shapes are a frozen contract
// with the dev client:
//   200 { installing: true, packages }  — plugin install in progress, client polls
//   500 { buildError: true, errors, message, source }  — build failed
//   404 'Page not found.'
//   200 pageConfig (+ _warnings)
async function jitPageHandler(c) {
  const context = c.get('lowdefyContext');
  const pageId = getPathSegments(c, '/api/page/').join('/');

  let buildResult;
  try {
    buildResult = await buildPageIfNeeded({ pageId });
  } catch (error) {
    const rawErrors = error.buildErrors ?? [error];
    const errors = [];
    for (const err of rawErrors) {
      await context.handleError(err);
      errors.push({
        type: err.name ?? 'Error',
        message: err.message,
        source: err.source ?? null,
        stack: err.stack ?? null,
      });
    }
    return c.json(
      {
        buildError: true,
        errors,
        // Keep top-level message/source for backward compatibility
        message: error.message,
        source: error.source ?? null,
      },
      500
    );
  }

  if (buildResult && buildResult.installing) {
    return c.json({
      installing: true,
      packages: buildResult.packages,
    });
  }

  const pageConfig = await getPageConfig(context, { pageId });
  if (pageConfig === null) {
    return c.text('Page not found.', 404);
  }
  if (buildResult?.warnings?.length > 0) {
    pageConfig._warnings = buildResult.warnings;
  }
  return c.json(pageConfig);
}

export default jitPageHandler;
