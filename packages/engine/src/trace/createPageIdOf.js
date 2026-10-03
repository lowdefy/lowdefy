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

import { parsePageId, type } from '@lowdefy/helpers';

// The page a URL shows. It reads the URL, never lowdefy.pageId: posthog-js captures a
// history_change pageview inside its pushState patch, before the next page renders. The app root
// serves the configured home page.
function createPageIdOf({ lowdefy }) {
  return function pageIdOf(url) {
    const pageId = parsePageId(url, lowdefy.basePath);
    if (!type.isNull(pageId)) {
      return pageId;
    }
    // The registry can be used before the client initialises lowdefy.
    if (lowdefy.home?.configured === true) {
      return lowdefy.home.pageId;
    }
    return null;
  };
}

export default createPageIdOf;
