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

import normalizeTrackingKey from './normalizeTrackingKey.js';

// Records what one block self-evaluation reads. The parser signals every operator call it makes
// (context._internal.readRecorder): read for each key the call reads, pure for a call that reads
// nothing, volatile or untracked otherwise. The engine adds its own reads with engineRead and sets
// parsedOperators, which the parser never sees. parserCalls counts only the parser's signals, so the
// engine can tell "the operators read nothing" (pure calls) from a parser that does not record.
// One is created per block evaluation, so the methods live on the prototype.
class ReadRecorder {
  constructor() {
    this.reads = new Set();
    this.parserCalls = 0;
    this.parsedOperators = false;
    this.untrackedReasons = [];
    this.volatileReasons = [];
  }

  read(key) {
    this.parserCalls += 1;
    if (!type.isString(key)) {
      this.untrackedReasons.push(`read key is not a string: ${JSON.stringify(key)}`);
      return;
    }
    this.reads.add(normalizeTrackingKey(key));
  }

  // The cheapest signal, for the most common call: it only proves the parser recorded.
  pure() {
    this.parserCalls += 1;
  }

  volatile(reason) {
    this.parserCalls += 1;
    this.volatileReasons.push(reason ?? 'volatile');
  }

  untracked(reason) {
    this.parserCalls += 1;
    this.untrackedReasons.push(reason ?? 'untracked');
  }

  engineRead(key) {
    this.reads.add(normalizeTrackingKey(key));
  }
}

export default ReadRecorder;
