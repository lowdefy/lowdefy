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

import TIERS from './tiers.js';

// Whether a computeTiers row is selected by a tier. Tiers nest, so a row is in
// its own tier and every wider one; an unranked journey is in every tier, and
// a deprecated one in none.
function inTier({ row, tier }) {
  if (row.deprecated) return false;
  if (tier === 'full' || row.unranked) return true;
  const names = TIERS.map((entry) => entry.name);
  return names.indexOf(row.tier) <= names.indexOf(tier);
}

export default inTier;
