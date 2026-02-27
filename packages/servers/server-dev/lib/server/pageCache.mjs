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
  }

  isCompiled(pageId) {
    return this.compiledPages.has(pageId);
  }

  markCompiled(pageId) {
    this.compiledPages.add(pageId);
  }

  async acquireBuildLock(pageId) {
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

  invalidateAll() {
    this.compiledPages.clear();
  }
}

export default PageCache;
