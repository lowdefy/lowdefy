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

import customTagTone from './customTagTone.js';
import TAG_TONES from './tagTones.js';

// A tone name (a preset colour or an antd status name) becomes its theme tokens; any other value
// is a CSS colour, with a readable text colour derived from it.
function resolveTagTone(value) {
  if (type.isNone(value)) return TAG_TONES.default;
  if (Object.hasOwn(TAG_TONES, value)) return TAG_TONES[value];
  return customTagTone(value);
}

export default resolveTagTone;
