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

import MiniSearch from 'minisearch';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import extractPageContent from './search/extractPageContent.js';
import resolveSections from './search/resolveSections.js';
import stripMarkdown from './search/stripMarkdown.js';

function buildSearchIndex(pages, vars) {
  const sectionMap = resolveSections(pages, vars.menus);

  const documents = pages.map((page) => {
    const text = extractPageContent(page);
    const section = sectionMap.get(page.id);
    const plainText = stripMarkdown(text);
    return {
      id: page.id,
      pageId: page.id,
      title: page.properties?.title ?? page.id,
      section: section?.label ?? 'Other',
      icon: section?.icon,
      description: plainText.slice(0, 200),
      content: plainText,
      snippet: plainText.slice(0, 200),
    };
  });

  const miniSearch = new MiniSearch({
    fields: ['title', 'content', 'description'],
    storeFields: ['title', 'pageId', 'section', 'snippet', 'icon'],
  });
  miniSearch.addAll(documents);

  const index = {
    engine: 'minisearch',
    version: 1,
    options: {
      fields: ['title', 'content', 'description'],
      storeFields: ['title', 'pageId', 'section', 'snippet', 'icon'],
      idField: 'id',
    },
    searchDefaults: {
      boost: { title: 2, description: 1.5 },
      fuzzy: 0.2,
      prefix: true,
    },
    resultDefaults: {
      title: 'title',
      description: 'snippet',
      category: 'section',
      pageId: 'pageId',
    },
    groups: [
      { label: 'Tutorial', match: { section: 'Tutorial' }, icon: 'AiOutlineRocket' },
      { label: 'Concepts', match: { section: 'Concepts' }, icon: 'AiOutlineBulb' },
      { label: 'Blocks', match: { section: 'Blocks' }, icon: 'AiOutlineLayout' },
      { label: 'Connections', match: { section: 'Connections' }, icon: 'AiOutlineApi' },
      { label: 'Actions', match: { section: 'Actions' }, icon: 'AiOutlineThunderbolt' },
      { label: 'Operators', match: { section: 'Operators' }, icon: 'AiOutlineFunction' },
      { label: 'Controls', match: { section: 'Controls' }, icon: 'AiOutlineBranches' },
    ],
    data: JSON.parse(JSON.stringify(miniSearch)),
  };

  const outputDir = path.join(dirname(fileURLToPath(import.meta.url)), '../public');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'search-index.json'), JSON.stringify(index));
}

export default buildSearchIndex;
