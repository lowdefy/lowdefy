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

import doubleSubmit from './doubleSubmit.js';
import empty from './empty.js';
import interrupt from './interrupt.js';
import negative from './negative.js';
import roleGranted from './roleGranted.js';
import tenant from './tenant.js';
import tenantCalls from './tenantCalls.js';
import volume from './volume.js';

// The variant kinds, in the order they are written, each with its generators.
// A generator returns its variants, or { skipped } with a note, or both as
// { variants, skipped: [notes] }.
const KINDS = ['role', 'tenant', 'empty', 'volume', 'negative', 'interrupt', 'double-submit'];

const generators = {
  role: [roleGranted],
  tenant: [tenant, tenantCalls],
  empty: [empty],
  volume: [volume],
  negative: [negative],
  interrupt: [interrupt],
  'double-submit': [doubleSubmit],
};

// The generators that read who the journey runs as (empty and volume look its user up by name in
// their data set). On a case-table journey, whose user is a
// `_case` placeholder, generateVariants runs them on each row's journey ('every'), or on the
// first row's alone ('first'): tenantCalls replays the payloads of the measured run, which is the
// first row's.
const ROW_GENERATORS = new Map([
  [empty, 'every'],
  [volume, 'every'],
  [roleGranted, 'every'],
  [tenant, 'every'],
  [tenantCalls, 'first'],
]);

export { KINDS, ROW_GENERATORS };
export default generators;
