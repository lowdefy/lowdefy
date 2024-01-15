/*
  Copyright 2020-2024 Lowdefy, Inc

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

function transformer(pages) {
  const sitemapStart = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  const sitemapEnd = `
</urlset>`;
  const now = new Date();
  const addPage = (acc, page) => {
    return acc.concat(`
    <url>
      <loc>https://docs.lowdefy.com/${page.id}</loc>
      <lastmod>${now.getFullYear()}-${now.getMonth() > 8 ? '' : 0}${now.getMonth() + 1}-${
        now.getDate() > 9 ? '' : 0
      }${now.getDate()}</lastmod>
    </url>
`);
  };

  const sitemap = pages.reduce(addPage, sitemapStart).concat(sitemapEnd);

  fs.writeFileSync(
    path.join(dirname(fileURLToPath(import.meta.url)), '../public/sitemap.xml'),
    sitemap
  );

  return pages;
}
export default transformer;
