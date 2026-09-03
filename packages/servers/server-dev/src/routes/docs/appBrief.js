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

import getAppBrief from '../../../lib/docs/getAppBrief.js';

// An unknown pageId or a `since` that is not a git ref is the caller's own
// mistake, so it answers 400 rather than a 500 that reads as "the brief broke".
function docsAppBriefHandler(c) {
  const brief = getAppBrief({
    pageId: c.req.param('pageId'),
    since: c.req.query('since'),
  });
  if (brief.error) {
    return c.json(brief, 400);
  }
  return c.json(brief);
}

export default docsAppBriefHandler;
