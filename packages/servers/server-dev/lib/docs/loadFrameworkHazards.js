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
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let hazards;

// Framework-level hazards ship hand-authored in @lowdefy/docs-content (its
// content/ directory is regenerated, hazards.json at the package root is
// not). Memoized like getDocsManifest: the list changes only with a release.
function loadFrameworkHazards() {
  if (hazards !== undefined) {
    return hazards;
  }
  try {
    const hazardsPath = require.resolve('@lowdefy/docs-content/hazards.json');
    hazards = JSON.parse(fs.readFileSync(hazardsPath, 'utf8'));
  } catch {
    // docs-content not installed — type-attached hazards are still served.
    // Memoized for the life of the dev server, so say so once: without this
    // line an install ordering problem is indistinguishable from having no
    // framework hazards at all.
    console.warn(
      '@lowdefy/docs-content is not installed, so no framework-level hazards will be served. Run the install and restart the dev server to get them back.'
    );
    hazards = null;
  }
  return hazards;
}

export default loadFrameworkHazards;
