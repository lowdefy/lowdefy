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

import fs from 'fs';
import path from 'path';

// doc.slug already encodes the <section>/<page-id> path, and doc.path is
// content/<slug>.md, so the public copy mirrors the docs-content layout exactly.
function copyMarkdownFiles({ manifest, contentDir, mdDir }) {
  fs.rmSync(mdDir, { recursive: true, force: true });
  manifest.docs.forEach((doc) => {
    const src = path.join(contentDir, doc.path);
    const dest = path.join(mdDir, `${doc.slug}.md`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  });
}

export default copyMarkdownFiles;
