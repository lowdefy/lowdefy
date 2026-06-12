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

import path from 'path';
import { pathToFileURL } from 'url';
import { cachedPromises } from '@lowdefy/helpers';

const validPathPattern = /^[A-Za-z0-9\-_/.:]+$/;

// S3a: compiled builds emit .mjs closure modules next to server config JSON
// artifacts. Missing modules resolve to null — walker builds have none, and
// the JSON path serves unchanged. Node's module cache deduplicates the
// actual loads; this cache only saves promise churn across requests.
const moduleCache = new Map();

function createImportConfigModule({ buildDirectory }) {
  async function importConfigModule(filePath) {
    if (!validPathPattern.test(filePath) || filePath.includes('..')) {
      return null;
    }
    try {
      return await import(
        /* @vite-ignore */ pathToFileURL(path.resolve(buildDirectory, filePath)).href
      );
    } catch (error) {
      if (error.code === 'ERR_MODULE_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }
  return cachedPromises({
    cache: moduleCache,
    getter: importConfigModule,
  });
}

export default createImportConfigModule;
