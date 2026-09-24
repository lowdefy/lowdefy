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

import createCounter from './createCounter.js';
import createTeeCounter from './createTeeCounter.js';

test('createTeeCounter increments both counters and keeps the app counter readable', () => {
  const counter = createCounter();
  const pageCounter = createCounter();
  const tee = createTeeCounter({ counter, pageCounter });
  tee.increment('Button', 'k1');
  tee.increment('Button', 'k2');
  expect(counter.getCounts()).toEqual({ Button: 2 });
  expect(pageCounter.getCounts()).toEqual({ Button: 2 });
  expect(tee.getCounts()).toEqual({ Button: 2 });
  expect(counter.getLocation('Button')).toEqual('k1');
});
