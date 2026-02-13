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

class PageCache {
  constructor() {
    this.compiledPages = new Set();
    this.buildLocks = new Map();
    this.skeletonLock = null;
  }

  isCompiled(pageId) {
    return this.compiledPages.has(pageId);
  }

  markCompiled(pageId) {
    this.compiledPages.add(pageId);
  }

  async acquireBuildLock(pageId) {
    // Wait for any skeleton rebuild first
    if (this.skeletonLock) {
      await this.skeletonLock;
    }

    // If page build already in progress, wait for it
    if (this.buildLocks.has(pageId)) {
      await this.buildLocks.get(pageId);
      return false;
    }

    // Create new lock
    let resolve;
    const promise = new Promise((r) => {
      resolve = r;
    });
    promise.resolve = resolve;
    this.buildLocks.set(pageId, promise);
    return true;
  }

  releaseBuildLock(pageId) {
    const lock = this.buildLocks.get(pageId);
    if (lock) {
      lock.resolve();
      this.buildLocks.delete(pageId);
    }
  }

  async acquireSkeletonLock() {
    // Wait for all in-progress page builds to complete
    await Promise.all(this.buildLocks.values());
    let resolve;
    this.skeletonLock = new Promise((r) => {
      resolve = r;
    });
    this.skeletonLock.resolve = resolve;
  }

  releaseSkeletonLock() {
    if (this.skeletonLock) {
      this.skeletonLock.resolve();
      this.skeletonLock = null;
    }
  }

  invalidateAll() {
    this.compiledPages.clear();
  }

  invalidatePages(pageIds) {
    for (const pageId of pageIds) {
      this.compiledPages.delete(pageId);
    }
  }

  invalidateByFiles(changedFiles, fileDependencyMap) {
    const affectedPages = new Set();
    for (const filePath of changedFiles) {
      const pageIds = fileDependencyMap.get(filePath);
      if (pageIds) {
        for (const pageId of pageIds) {
          affectedPages.add(pageId);
        }
      }
    }
    this.invalidatePages(affectedPages);
    return affectedPages;
  }
}

export default PageCache;
