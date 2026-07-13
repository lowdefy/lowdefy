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

import getPluginDoc from '../../../lib/docs/getPluginDoc.js';

function docsPluginDocHandler(c) {
  const packageName = c.req.param('package');
  const doc = getPluginDoc({ packageName });
  if (doc === null) {
    return c.json(
      {
        error: `Package "${packageName}" ships no markdown docs. See GET /lowdefy-docs/plugins for its types.`,
      },
      404
    );
  }
  return c.text(doc.markdown, 200, { 'Content-Type': 'text/markdown; charset=utf-8' });
}

export default docsPluginDocHandler;
