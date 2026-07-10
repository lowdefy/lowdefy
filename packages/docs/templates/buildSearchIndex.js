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
import stripMarkdown from './search/stripMarkdown.js';

const groupIcons = {
  Learn: 'AiOutlineRocket',
  Reference: 'AiOutlineBook',
  Recipes: 'AiOutlineExperiment',
  Plugins: 'AiOutlineAppstore',
};

// records: pageId -> { tab, tabTitle, title, trail } — computed by the menu
// transformer in generateSiteAssets.js (one walk shared by sidebar,
// breadcrumbs, prev/next, and this index).
function buildSearchIndex(pages, records) {
  const documents = pages.filter(Boolean).map((page) => {
    const text = extractPageContent(page);
    const record = records.get(page.id);
    const plainText = stripMarkdown(text);
    const section = record?.tabTitle ?? 'Other';
    return {
      id: page.id,
      pageId: page.id,
      title: page.properties?.title ?? page.id,
      section,
      sectionTrail: record ? [...record.trail, page.properties?.title ?? record.title] : [],
      icon: groupIcons[section],
      description: plainText.slice(0, 200),
      content: plainText,
      snippet: plainText.slice(0, 200),
    };
  });

  const miniSearch = new MiniSearch({
    fields: ['title', 'content', 'description'],
    storeFields: ['title', 'pageId', 'section', 'sectionTrail', 'snippet', 'icon'],
  });
  miniSearch.addAll(documents);

  const index = {
    engine: 'minisearch',
    version: 1,
    options: {
      fields: ['title', 'content', 'description'],
      storeFields: ['title', 'pageId', 'section', 'sectionTrail', 'snippet', 'icon'],
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
      breadcrumb: 'sectionTrail',
      pageId: 'pageId',
    },
    groups: [
      { label: 'Learn', match: { section: 'Learn' }, icon: groupIcons.Learn },
      { label: 'Reference', match: { section: 'Reference' }, icon: groupIcons.Reference },
      { label: 'Recipes', match: { section: 'Recipes' }, icon: groupIcons.Recipes },
      { label: 'Plugins', match: { section: 'Plugins' }, icon: groupIcons.Plugins },
    ],
    data: JSON.parse(JSON.stringify(miniSearch)),
  };

  const outputDir = path.join(dirname(fileURLToPath(import.meta.url)), '../public');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'search-index.json'), JSON.stringify(index));
}

export default buildSearchIndex;
