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

import { type } from '@lowdefy/helpers';

// A view page is one the build marked view: true - a page some MCP tool names
// as its view, or one mcp.viewPages lists. A view runs the web client, so a
// page built for the mobile shell alone is not served to one even when the app
// names it: the build does not refuse that combination, and this does.
function isViewPage({ pageConfig }) {
  if (type.isNone(pageConfig)) {
    return false;
  }
  return pageConfig.view === true && pageConfig.target !== 'mobile';
}

export default isViewPage;
