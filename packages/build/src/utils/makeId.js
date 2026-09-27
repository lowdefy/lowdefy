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

class MakeId {
  constructor() {
    this.counter = 0;
    this.prefix = '';
  }

  next() {
    this.counter++;
    return `${this.prefix}${this.counter.toString(36)}`;
  }

  // The dev server rebuilds config without restarting, and pages and requests that
  // started before a rebuild still report errors with the earlier build's keys. A dev
  // build passes a fresh prefix, so those keys never name a node of the new build.
  reset({ prefix = '' } = {}) {
    this.counter = 0;
    this.prefix = prefix;
  }

  // JIT page builds continue the keys of the config build they build against. Within
  // one config build the counter only moves forward, so a recreated build context never
  // hands out a key an earlier page build used.
  continueFrom({ prefix, counter }) {
    if (prefix !== this.prefix) {
      this.prefix = prefix;
      this.counter = counter;
      return;
    }
    this.counter = Math.max(this.counter, counter);
  }
}

const makeId = new MakeId();

export default makeId;
