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

import { type } from '@lowdefy/helpers';

function collectRefPaths(obj, paths) {
  if (type.isObject(obj)) {
    if (obj['~shallow'] && obj._ref) {
      const refPath = type.isString(obj._ref) ? obj._ref : obj._ref.path;
      if (refPath) {
        paths.add(refPath);
      }
      return;
    }
    for (const value of Object.values(obj)) {
      collectRefPaths(value, paths);
    }
  } else if (type.isArray(obj)) {
    for (const item of obj) {
      collectRefPaths(item, paths);
    }
  }
}

function createFileDependencyMap({ pageRegistry, refMap }) {
  const fileDependencyMap = new Map();

  for (const [pageId, pageEntry] of pageRegistry) {
    // Include the page's own source file as a dependency.
    // The refId traces back to the refMap entry with the file path.
    if (pageEntry.refId && refMap[pageEntry.refId]?.path) {
      addFileDependency(fileDependencyMap, refMap[pageEntry.refId].path, pageId);
    }

    // Collect all unresolved ref paths from this page's raw content
    const refPaths = new Set();
    collectRefPaths(pageEntry.rawContent, refPaths);

    // Also trace through the refMap to find all files referenced by this page's refs
    // Walk the parent chain from each ref to find the page-level refs
    for (const refPath of refPaths) {
      addFileDependency(fileDependencyMap, refPath, pageId);
    }
  }

  return fileDependencyMap;
}

function addFileDependency(map, filePath, pageId) {
  if (!map.has(filePath)) {
    map.set(filePath, new Set());
  }
  map.get(filePath).add(pageId);
}

export default createFileDependencyMap;
