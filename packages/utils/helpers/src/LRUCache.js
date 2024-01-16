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

// https://stackoverflow.com/a/46432113/8295949
// Implementation of Least Recently Updated cache.
// It uses the fact that the implementation of Map keep track of item insertion order
class LRUCache {
  constructor({ maxSize = 100 } = {}) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (item) {
      // Refresh key.
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key, val) {
    if (this.cache.has(key)) {
      // Refresh key
      this.cache.delete(key);
    } else if (this.cache.size === this.maxSize) {
      // Evict oldest
      this.cache.delete(this.first());
    }
    this.cache.set(key, val);
  }

  first() {
    return this.cache.keys().next().value;
  }
}

export default LRUCache;
