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
import roleRefused from './roleRefused.js';
import tenant from './tenant.js';
import volume from './volume.js';

// The variant kinds, in the order they are written, each with its generators.
// A generator returns its variants, or { skipped } with a note, or both as
// { variants, skipped: [notes] }.
const KINDS = ['role', 'tenant', 'empty', 'volume', 'negative', 'interrupt', 'double-submit'];

const generators = {
  role: [roleGranted, roleRefused],
  tenant: [tenant],
  empty: [empty],
  volume: [volume],
  negative: [negative],
  interrupt: [interrupt],
  'double-submit': [doubleSubmit],
};

export { KINDS };
export default generators;
