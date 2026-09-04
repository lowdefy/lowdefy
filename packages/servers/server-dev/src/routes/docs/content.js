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

import getCoreDoc from '../../../lib/docs/getCoreDoc.js';

function docsContentHandler(c) {
  const slug = c.req.param('slug');
  const doc = getCoreDoc({ slug });
  if (doc === null) {
    return c.json(
      {
        error: `No doc found for slug "${slug}". Use GET /lowdefy-docs/search?q=... to find the right slug.`,
      },
      404
    );
  }
  return c.text(doc.markdown, 200, { 'Content-Type': 'text/markdown; charset=utf-8' });
}

export default docsContentHandler;
