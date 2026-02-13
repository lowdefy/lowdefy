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

import apiWrapper from '../../../lib/server/apiWrapper.js';
import buildPageIfNeeded from '../../../lib/server/jitPageBuilder.js';
import logError from '../../../lib/server/log/logError.js';

async function handler({ context, req, res }) {
  const { pageId } = req.query;

  // Attempt JIT build if page not yet compiled
  try {
    await buildPageIfNeeded({
      pageId,
      buildDirectory: context.buildDirectory,
      configDirectory: context.configDirectory,
    });
  } catch (error) {
    const rawErrors = error.buildErrors ?? [error];
    const errors = [];
    for (const err of rawErrors) {
      await logError({ context, error: err });
      errors.push({
        type: err.name ?? 'Error',
        message: err.message,
        source: err.source ?? null,
      });
    }
    res.status(500).json({
      buildError: true,
      errors,
      // Keep top-level message/source for backward compatibility
      message: error.message,
      source: error.source ?? null,
    });
    return;
  }

  const pageConfig = await getPageConfig(context, { pageId });
  if (pageConfig === null) {
    res.status(404).send('Page not found.');
  } else {
    res.status(200).json(pageConfig);
  }
}

export default apiWrapper(handler);
