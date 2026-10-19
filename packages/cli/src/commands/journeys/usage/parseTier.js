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

import TIERS from './tiers.js';

// `--tier <common|wide|edge|full>`; `full`, every journey, when not given.
function parseTier(value) {
  if (type.isNone(value)) return 'full';
  const names = TIERS.map((tier) => tier.name);
  if (!names.includes(value)) {
    throw new Error(
      `--tier should be one of ${names.join(', ')}. Received ${JSON.stringify(value)}.`
    );
  }
  return value;
}

export default parseTier;
