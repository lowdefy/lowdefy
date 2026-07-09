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

import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import extractAgentDocs from '@lowdefy/docs-content/scripts/extractAgentDocs.js';

import generateLlmsTxt from './generateLlmsTxt.js';
import generateSitemap from './generateSitemap.js';
import buildSearchIndex from './buildSearchIndex.js';

function transformer(pages, vars) {
  generateSitemap(pages);
  buildSearchIndex(pages, vars);
  if (process.env.LOWDEFY_EXTRACT_AGENT_DOCS === 'true') {
    extractAgentDocs({
      pages,
      menus: vars.menus,
      outputDir: path.resolve(dirname(fileURLToPath(import.meta.url)), '../../docs-content'),
    });
  }
  // Runs after extractAgentDocs so a `docs:content` run picks up the freshly
  // extracted markdown; otherwise it reads the installed docs-content package.
  generateLlmsTxt();
  return pages;
}

export default transformer;
