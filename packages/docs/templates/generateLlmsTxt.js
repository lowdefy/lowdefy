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
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import buildLlmsFullTxt from './llms/buildLlmsFullTxt.js';
import buildLlmsTxt from './llms/buildLlmsTxt.js';
import copyMarkdownFiles from './llms/copyMarkdownFiles.js';
import getDocsContent from './llms/getDocsContent.js';
import groupDocsBySection from './llms/groupDocsBySection.js';

// Serves docs.lowdefy.com/md/<slug>.md, /llms.txt and /llms-full.txt from the
// @lowdefy/docs-content package. Runs as part of the docs site build, so it must
// never crash that build if docs-content isn't resolvable (e.g. a stripped install).
function generateLlmsTxt() {
  const docsContent = getDocsContent();
  if (docsContent === null) {
    console.warn('generateLlmsTxt: @lowdefy/docs-content is not resolvable, skipping.');
    return;
  }
  const { manifest, contentDir } = docsContent;

  const publicDir = path.resolve(dirname(fileURLToPath(import.meta.url)), '../public');
  copyMarkdownFiles({ manifest, contentDir, mdDir: path.join(publicDir, 'md') });

  const groupedSections = groupDocsBySection(manifest.docs);
  fs.writeFileSync(path.join(publicDir, 'llms.txt'), buildLlmsTxt(groupedSections));
  fs.writeFileSync(path.join(publicDir, 'llms-full.txt'), buildLlmsFullTxt({ manifest, contentDir }));
}

export default generateLlmsTxt;
