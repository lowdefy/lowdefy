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

const CATEGORIES = ['actions', 'blocks', 'operators'];

// The types of a page's type set (from the mobile root) this shell cannot render: each one the
// manifest lacks, or carries from another package or another major version of it. A page renders
// only when this is empty.
function checkTypeSet({ manifest, typeSet }) {
  const missing = [];
  CATEGORIES.forEach((category) => {
    (typeSet[category] ?? []).forEach((needed) => {
      const carried = manifest[category]?.[needed.type];
      if (
        carried === undefined ||
        carried.package !== needed.package ||
        carried.version !== needed.version
      ) {
        missing.push({ category, ...needed });
      }
    });
  });
  return missing;
}

export default checkTypeSet;
