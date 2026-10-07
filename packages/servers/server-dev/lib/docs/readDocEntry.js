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

import fs from 'node:fs';
import { type } from '@lowdefy/helpers';

import makeModuleManifestDoc from './makeModuleManifestDoc.js';

const coreContent = new Map();

// Core docs ship with the installed docs package and never change while the
// server runs, so they are read once. Plugin and module docs are read on
// every call; a module's manifest page is generated from its build entry.
function readDocEntry({ entry }) {
  if (!type.isUndefined(entry.moduleEntry)) {
    return makeModuleManifestDoc({ moduleEntry: entry.moduleEntry });
  }
  if (entry.source !== 'core') {
    return fs.readFileSync(entry.filePath, 'utf8');
  }
  if (!coreContent.has(entry.filePath)) {
    coreContent.set(entry.filePath, fs.readFileSync(entry.filePath, 'utf8'));
  }
  return coreContent.get(entry.filePath);
}

export default readDocEntry;
