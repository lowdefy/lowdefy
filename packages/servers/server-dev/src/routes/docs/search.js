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

import docSources from '../../../lib/docs/docSources.js';
import searchDocs from '../../../lib/docs/searchDocs.js';

function docsSearchHandler(c) {
  const query = c.req.query('q');
  const source = c.req.query('source');
  if (!query || query.trim() === '') {
    return c.json(
      { error: 'Missing search query. Use GET /lowdefy-docs/search?q=your+keywords.' },
      400
    );
  }
  if (source !== undefined && !docSources.includes(source)) {
    return c.json(
      {
        error: `Unknown docs source "${source}". Use one of: ${docSources.join(', ')}.`,
      },
      400
    );
  }
  return c.json(searchDocs({ query, source }));
}

export default docsSearchHandler;
