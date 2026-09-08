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

import schema from './schema.js';

const MIN_INTERVAL_MS = 100;

// Emits a { tick, at } message on a fixed interval. A realtime source with
// zero external dependencies — used in examples and end-to-end tests.
async function Interval({ properties, publish, signal }) {
  if (!type.isNone(properties.ms) && !type.isNumber(properties.ms)) {
    throw new Error('Interval "ms" property should be a number.');
  }
  const ms = Math.max(properties.ms ?? 1000, MIN_INTERVAL_MS);

  if (signal.aborted) {
    return;
  }

  let tick = 0;
  const timer = setInterval(() => {
    tick += 1;
    publish({ data: { tick, at: new Date() } });
  }, ms);

  await new Promise((resolve) => {
    signal.addEventListener('abort', resolve, { once: true });
  });
  clearInterval(timer);
}

Interval.schema = schema;
Interval.meta = {
  publish: false,
};

export default Interval;
