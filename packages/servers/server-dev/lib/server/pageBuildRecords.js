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

import { AsyncLocalStorage } from 'node:async_hooks';
import path from 'node:path';

import { resolveErrorLocation } from '@lowdefy/errors';

import mapPageBuildErrors from '../docs/mapPageBuildErrors.js';

// What each page's latest JIT build read and how it ended, kept for the life of
// the server process. The dev tools use it to tell which built pages an edit
// touched and which pages currently fail to build, without the page being
// requested. Pages build concurrently on one shared build context, so the files
// a build reads are attributed through async context rather than the context.
const fileReads = new AsyncLocalStorage();
const records = new Map();

function trackFileReads({ context, configDirectory }) {
  const readConfigFile = context.readConfigFile;
  context.readConfigFile = (filePath) => {
    fileReads.getStore()?.add(path.resolve(configDirectory, filePath));
    return readConfigFile(filePath);
  };
}

// The page route resolves a build error's source when it logs the error; a
// build nobody requested is never logged, so its errors are located here, from
// the keys the build added to its context.
function locateErrors({ error, context, configDirectory }) {
  for (const buildError of error.buildErrors ?? [error]) {
    if (buildError.source) continue;
    try {
      buildError.source =
        resolveErrorLocation(buildError, {
          keyMap: context.keyMap,
          refMap: context.refMap,
          configDirectory,
        })?.source ?? null;
    } catch {
      // A malformed keyMap or refMap entry leaves the error unlocated.
    }
  }
}

async function record({ pageId, context, configDirectory, build }) {
  const files = new Set();
  const builtAt = Date.now();
  let result;
  try {
    result = await fileReads.run(files, build);
  } catch (error) {
    locateErrors({ error, context, configDirectory });
    records.set(pageId, { builtAt, files, errors: mapPageBuildErrors(error) });
    throw error;
  }
  // A plugin install ends the build before the page is built, so the page's
  // previous record still describes it.
  if (!result?.installing) {
    records.set(pageId, { builtAt, files, errors: null });
  }
  return result;
}

function get(pageId) {
  return records.get(pageId) ?? null;
}

export default { get, record, trackFileReads };
