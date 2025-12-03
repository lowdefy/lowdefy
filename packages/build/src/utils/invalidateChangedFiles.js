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

/**
 * Find all files affected by changes to the given files.
 * Traverses the dependency graph upward to find all transitive dependents.
 *
 * @param {string[]} changedFiles - Array of file paths that changed
 * @param {Map<string, Set<string>>} dependencyGraph - Map of file -> Set of files that depend on it
 * @returns {Set<string>} - Set of all affected file paths (including the changed files)
 */
function getAffectedFiles(changedFiles, dependencyGraph) {
  const affected = new Set();
  const queue = [...changedFiles];

  while (queue.length > 0) {
    const file = queue.shift();
    if (affected.has(file)) {
      continue;
    }
    affected.add(file);

    // Find files that depend on this file
    const dependents = dependencyGraph.get(file);
    if (dependents) {
      for (const dependent of dependents) {
        if (!affected.has(dependent)) {
          queue.push(dependent);
        }
      }
    }
  }

  return affected;
}

/**
 * Invalidate cache entries for changed files and their dependents.
 *
 * @param {Object} options
 * @param {string[]} options.changedFiles - Array of file paths that changed
 * @param {Map<string, Set<string>>} options.dependencyGraph - Dependency graph
 * @param {Map<string, any>} options.parsedContentCache - Cache of parsed file content
 * @param {Map<string, any>} options.refCache - Cache of resolved refs
 * @param {Map<string, Set<string>>} options.pathToRefHashes - Maps file path to ref hashes
 * @param {Object} options.logger - Logger instance
 * @returns {Set<string>} - Set of affected file paths that were invalidated
 */
function invalidateChangedFiles({
  changedFiles,
  dependencyGraph,
  parsedContentCache,
  refCache,
  pathToRefHashes,
  logger,
}) {
  if (!changedFiles || changedFiles.length === 0) {
    return new Set();
  }

  const affectedFiles = getAffectedFiles(changedFiles, dependencyGraph);

  // Invalidate parsedContentCache entries for affected files
  // The cache keys may include vars suffix for nunjucks files, so we need to check prefixes
  for (const cacheKey of parsedContentCache.keys()) {
    const filePath = cacheKey.split('::')[0]; // Remove vars suffix if present
    if (affectedFiles.has(filePath)) {
      parsedContentCache.delete(cacheKey);
    }
  }

  // Invalidate refCache entries for affected files using pathToRefHashes mapping
  if (refCache && pathToRefHashes) {
    for (const filePath of affectedFiles) {
      const hashes = pathToRefHashes.get(filePath);
      if (hashes) {
        for (const hash of hashes) {
          refCache.delete(hash);
        }
        // Also clear the path mapping since it will be rebuilt
        pathToRefHashes.delete(filePath);
      }
    }
  }

  if (logger?.level === 'debug' && affectedFiles.size > 0) {
    logger.debug(`Incremental build: ${changedFiles.length} file(s) changed`);
    logger.debug(`Incremental build: ${affectedFiles.size} file(s) affected`);
  }

  return affectedFiles;
}

export default invalidateChangedFiles;
export { getAffectedFiles };

