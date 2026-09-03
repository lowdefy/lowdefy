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

import getPageConfig from '../../../lib/docs/getPageConfig.js';

// 404 when the pageId isn't registered at all. 200 with { buildError, errors }
// when the pageId is registered but its JIT build failed — agents need the
// errors in the body, not just a failing status code.
async function docsPageConfigHandler(c) {
  const pageId = c.req.param('pageId');
  const result = await getPageConfig({ pageId });
  if (result === null) {
    return c.json(
      {
        error: `No page found for pageId "${pageId}". Check the pageId in your lowdefy.yaml pages config.`,
      },
      404
    );
  }
  return c.json(result);
}

export default docsPageConfigHandler;
